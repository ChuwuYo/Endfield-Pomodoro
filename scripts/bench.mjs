import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const BASELINE = join(ROOT, "bench", "baseline.json");
const PORT = Number(process.env.BENCH_PORT ?? 4178);
const TICK_MS = Number(process.env.BENCH_TICK_MS ?? 8000);
const CPU_THROTTLE = Number(process.env.BENCH_CPU ?? 4);
const SAVE = process.argv.includes("--save");

const CHROME_CANDIDATES = [
    process.env.BENCH_CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

const MIME = {
    ".css": "text/css",
    ".eot": "application/vnd.ms-fontobject",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".json": "application/json",
    ".mjs": "text/javascript",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".webmanifest": "application/manifest+json",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
};

const startServer = async () => {
    const server = createServer(async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        let path = join(DIST, decodeURIComponent(url.pathname));
        if (!path.startsWith(DIST)) {
            res.writeHead(403).end();
            return;
        }
        if (!existsSync(path) || url.pathname.endsWith("/")) {
            path = join(DIST, "index.html");
        }
        try {
            const body = await readFile(path);
            res.writeHead(200, {
                "content-type":
                    MIME[extname(path)] ?? "application/octet-stream",
                "cache-control": "no-store",
                // SW 需要这个头才能控制整个源
                "service-worker-allowed": "/",
            });
            res.end(body);
        } catch {
            res.writeHead(404).end();
        }
    });
    await new Promise((done) => server.listen(PORT, "127.0.0.1", done));
    return server;
};

class CDP {
    #ws;
    #id = 0;
    #pending = new Map();
    #handlers = new Map();

    constructor(ws) {
        this.#ws = ws;
    }

    static async connect(url) {
        const ws = new WebSocket(url);
        await new Promise((done, fail) => {
            ws.onopen = done;
            ws.onerror = () => fail(new Error(`cannot connect to ${url}`));
        });
        const client = new CDP(ws);
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const waiter = client.#pending.get(msg.id);
            if (waiter) {
                client.#pending.delete(msg.id);
                if (msg.error) waiter.reject(new Error(msg.error.message));
                else waiter.resolve(msg.result);
                return;
            }
            for (const handler of client.#handlers.get(msg.method) ?? [])
                handler(msg.params, msg.sessionId);
        };
        return client;
    }

    send(method, params = {}, sessionId) {
        const id = ++this.#id;
        this.#ws.send(
            JSON.stringify({
                id,
                method,
                params,
                ...(sessionId ? { sessionId } : {}),
            }),
        );
        return new Promise((resolve, reject) =>
            this.#pending.set(id, { resolve, reject }),
        );
    }

    on(method, handler) {
        const list = this.#handlers.get(method) ?? [];
        list.push(handler);
        this.#handlers.set(method, list);
    }

    close() {
        this.#ws.close();
    }
}

const launchChrome = async (profileDir) => {
    // 随机端口：上一个 Chrome 尚未退出时固定端口会绑不上，表现为整轮 bench 崩掉
    const cdpPort = 9300 + Math.floor(Math.random() * 500);
    const bin = CHROME_CANDIDATES.find((p) => existsSync(p));
    if (!bin) throw new Error("no Chrome/Edge binary found; set BENCH_CHROME");
    const proc = spawn(
        bin,
        [
            "--headless=new",
            `--remote-debugging-port=${cdpPort}`,
            "--remote-allow-origins=*",
            `--user-data-dir=${profileDir}`,
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            // 锁 60Hz：不加时 headless 合成器自由跑（54-165fps），时长指标无法跨轮比较
            "--disable-gpu",
            "--disable-background-networking",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding",
            "--disable-backgrounding-occluded-windows",
            "--window-size=1440,900",
            "about:blank",
        ],
        { stdio: "ignore" },
    );
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
            if (res.ok) return { proc, info: await res.json() };
        } catch {
            await new Promise((r) => setTimeout(r, 150));
        }
    }
    proc.kill();
    throw new Error("chrome did not expose the devtools port");
};

const COLLECTORS = `(() => {
  const b = (window.__bench = { paints: [], lcp: 0, longTasks: [], frames: [], mutations: 0, markStart: 0, markEnd: 0 });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) b.paints.push({ name: e.name, t: Math.round(e.startTime) });
  }).observe({ type: "paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) b.lcp = Math.round(e.startTime);
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) b.longTasks.push(Math.round(e.duration));
  }).observe({ type: "longtask", buffered: true });
  // 用 document：此脚本在解析前执行，documentElement 还是 null
  new MutationObserver((records) => {
    for (const r of records)
      b.mutations += r.type === "childList" ? r.addedNodes.length + r.removedNodes.length : 1;
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  let last = performance.now();
  const loop = (now) => {
    if (b.markStart) b.frames.push(Math.round((now - last) * 10) / 10);
    last = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();`;

const evaluate = async (cdp, sessionId, expression) => {
    const { result, exceptionDetails } = await cdp.send(
        "Runtime.evaluate",
        { expression, awaitPromise: true, returnByValue: true },
        sessionId,
    );
    if (exceptionDetails) {
        throw new Error(
            exceptionDetails.exception?.description ??
                exceptionDetails.text ??
                "evaluate failed",
        );
    }
    return result.value;
};

const metricsOf = async (cdp, sessionId) =>
    Object.fromEntries(
        (await cdp.send("Performance.getMetrics", {}, sessionId)).metrics.map(
            (m) => [m.name, m.value],
        ),
    );

const percentile = (values, p) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return (
        Math.round(
            sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] *
                10,
        ) / 10
    );
};

const dirBytes = async (dir) => {
    let total = 0;
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            const nested = await dirBytes(path);
            total += nested.total;
            files.push(...nested.files);
        } else {
            const size = (await readFile(path)).byteLength;
            total += size;
            files.push({ name: entry.name, size });
        }
    }
    return { total, files };
};

const precacheManifest = async () => {
    const sw = await readFile(join(DIST, "sw.js"), "utf8");
    const start = sw.indexOf("precacheAndRoute([");
    const end = sw.indexOf("]),", start);
    const urls = [...sw.slice(start, end).matchAll(/url:"([^"]+)"/g)].map(
        (m) => m[1],
    );
    const unique = [...new Set(urls)];
    let total = 0;
    const files = [];
    for (const url of unique) {
        try {
            const size = (await readFile(join(DIST, url))).byteLength;
            total += size;
            files.push({ name: url, size });
        } catch {
            files.push({ name: `${url} (missing)`, size: 0 });
        }
    }
    return { entries: unique.length, total, files };
};

const CLICK_START = `(() => {
  const timer = document.querySelector('[role="timer"]');
  if (!timer) return "no-timer";
  let node = timer;
  while (node && node.querySelectorAll("button").length < 3) node = node.parentElement;
  const scope = node ?? document;
  const button = [...scope.querySelectorAll("button")].find((b) => b.textContent.trim());
  if (!button) return "no-button";
  button.click();
  return "clicked";
})()`;

const run = async () => {
    if (!existsSync(DIST))
        throw new Error("dist/ missing — run `pnpm build` first");
    const server = await startServer();
    const profileDir = join(tmpdir(), `endfield-bench-${process.pid}`);
    await mkdir(profileDir, { recursive: true });
    const { proc, info } = await launchChrome(profileDir);
    const cdp = await CDP.connect(info.webSocketDebuggerUrl);

    try {
        const { targetId } = await cdp.send("Target.createTarget", {
            url: "about:blank",
        });
        const { sessionId } = await cdp.send("Target.attachToTarget", {
            targetId,
            flatten: true,
        });

        await cdp.send("Page.enable", {}, sessionId);
        await cdp.send("Runtime.enable", {}, sessionId);
        await cdp.send("Performance.enable", {}, sessionId);
        await cdp.send(
            "Emulation.setDeviceMetricsOverride",
            {
                width: 1440,
                height: 900,
                deviceScaleFactor: 1,
                mobile: false,
            },
            sessionId,
        );
        await cdp.send(
            "Emulation.setCPUThrottlingRate",
            { rate: CPU_THROTTLE },
            sessionId,
        );
        await cdp.send(
            "Page.addScriptToEvaluateOnNewDocument",
            { source: COLLECTORS },
            sessionId,
        );

        const loaded = new Promise((done) =>
            cdp.on(
                "Page.loadEventFired",
                (_p, sid) => sid === sessionId && done(),
            ),
        );
        await cdp.send(
            "Page.navigate",
            { url: `http://127.0.0.1:${PORT}/` },
            sessionId,
        );
        await loaded;
        // 等字体子集下载完成再进入测量：否则下载与计时窗口重叠，tick 指标噪声
        // 会从 ±7% 涨到 ±300%
        await evaluate(cdp, sessionId, "document.fonts.ready.then(() => true)");
        await new Promise((r) => setTimeout(r, 1500));

        const loadMetrics = await metricsOf(cdp, sessionId);
        const load = await evaluate(
            cdp,
            sessionId,
            `(() => {
              const b = window.__bench;
              const nav = performance.getEntriesByType("navigation")[0] ?? {};
              const paint = (n) => b.paints.find((p) => p.name === n)?.t ?? 0;
              const res = performance.getEntriesByType("resource");
              const fonts = res.filter((r) => /\.(woff2?|ttf|eot)$/.test(r.name));
              const fcpAt = paint("first-contentful-paint");
              // CJK 字族 CSS 是动态 import 的：必须先于首屏绘制到达，否则首屏中文
              // 会用系统字体画一帧再换（FOUT），属于用户可见的回归
              const cjkCss = res.filter((r) => /(400|700)-[^/]+\.css$/.test(r.name));
              const cjkCssLate = cjkCss.filter((r) => r.responseEnd > fcpAt).length;
              return {
                fcp: fcpAt,
                lcp: b.lcp,
                dcl: Math.round(nav.domContentLoadedEventEnd ?? 0),
                load: Math.round(nav.loadEventEnd ?? 0),
                requests: res.length + 1,
                transferredKB: Math.round(res.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
                fontRequests: fonts.length,
                cjkCssChunks: cjkCss.length,
                cjkCssLate,
                nodes: document.querySelectorAll("*").length,
              };
            })()`,
        );

        const click = await evaluate(cdp, sessionId, CLICK_START);
        const originBefore = await evaluate(
            cdp,
            sessionId,
            "performance.timeOrigin",
        );
        await evaluate(
            cdp,
            sessionId,
            `window.__bench.markStart = performance.now()`,
        );
        const before = await metricsOf(cdp, sessionId);
        await new Promise((r) => setTimeout(r, TICK_MS));
        await evaluate(
            cdp,
            sessionId,
            `window.__bench.markEnd = performance.now()`,
        );
        const after = await metricsOf(cdp, sessionId);
        const originAfter = await evaluate(
            cdp,
            sessionId,
            "performance.timeOrigin",
        );
        if (originBefore !== originAfter) {
            throw new Error("page reloaded during the tick window");
        }
        const window = await evaluate(
            cdp,
            sessionId,
            `(() => {
              const b = window.__bench;
              const longTasks = b.longTasks.slice();
              const seconds = (b.markEnd - b.markStart) / 1000;
              return {
                seconds: Math.round(seconds * 100) / 100,
                mutations: b.mutations,
                longTasks: longTasks.length,
                longestTask: longTasks.length ? Math.max(...longTasks) : 0,
                frames: b.frames.length,
                fps: Math.round((b.frames.length / seconds) * 10) / 10,
                droppedFrames: Math.max(0, Math.round(60 * seconds - b.frames.length)),
                slowFrames16: b.frames.filter((f) => f > 16.7).length,
                slowFrames8: b.frames.filter((f) => f > 8.4).length,
                frameP95: (() => { const s = [...b.frames].sort((a, c) => a - c); return s.length ? Math.round(s[Math.floor(s.length * 0.95)] * 10) / 10 : 0; })(),
              };
            })()`,
        );

        const dist = await dirBytes(DIST);
        const precache = await precacheManifest();

        return {
            startClicked: click,
            config: { cpuThrottle: CPU_THROTTLE, tickMs: TICK_MS },
            launch: {
                fcp: load.fcp,
                lcp: load.lcp,
                domContentLoaded: load.dcl,
                loadEvent: load.load,
                scriptMs: Math.round(loadMetrics.ScriptDuration * 1000),
                layoutMs: Math.round(loadMetrics.LayoutDuration * 1000),
                styleRecalcMs: Math.round(
                    loadMetrics.RecalcStyleDuration * 1000,
                ),
                taskMs: Math.round(loadMetrics.TaskDuration * 1000),
                domNodes: load.nodes,
                requests: load.requests,
                transferredKB: load.transferredKB,
                fontRequests: load.fontRequests,
                cjkCssChunks: load.cjkCssChunks,
                cjkCssLate: load.cjkCssLate,
            },
            tick: {
                scriptMs: Math.round(
                    (after.ScriptDuration - before.ScriptDuration) * 1000,
                ),
                layoutMs: Math.round(
                    (after.LayoutDuration - before.LayoutDuration) * 1000,
                ),
                // headless 下 RecalcStyleCount 恒为每帧 1 次，只保留时长
                styleRecalcMs: Math.round(
                    (after.RecalcStyleDuration - before.RecalcStyleDuration) *
                        1000,
                ),
                taskMs: Math.round(
                    (after.TaskDuration - before.TaskDuration) * 1000,
                ),
                layouts: after.LayoutCount - before.LayoutCount,
                domMutations: window.mutations,
                longTasks: window.longTasks,
                longestTask: window.longestTask,
                fps: window.fps,
                droppedFrames: window.droppedFrames,
                slowFrames16: window.slowFrames16,
                slowFrames8: window.slowFrames8,
                frameP95: window.frameP95,
                perFrameTaskMs:
                    Math.round(
                        (((after.TaskDuration - before.TaskDuration) * 1000) /
                            window.frames) *
                            100,
                    ) / 100,
                perFrameLayoutMs:
                    Math.round(
                        (((after.LayoutDuration - before.LayoutDuration) *
                            1000) /
                            window.frames) *
                            100,
                    ) / 100,
                perFrameStyleMs:
                    Math.round(
                        (((after.RecalcStyleDuration -
                            before.RecalcStyleDuration) *
                            1000) /
                            window.frames) *
                            100,
                    ) / 100,
            },
            assets: {
                distKB: Math.round(dist.total / 1024),
                precacheEntries: precache.entries,
                precacheKB: Math.round(precache.total / 1024),
                largest: dist.files
                    .sort((a, b) => b.size - a.size)
                    .slice(0, 6)
                    .map((f) => `${f.name} ${Math.round(f.size / 1024)}KB`),
            },
        };
    } finally {
        cdp.close();
        proc.kill();
        server.close();
        await rm(profileDir, { recursive: true, force: true }).catch(() => {});
    }
};

const RUNS = Number(process.env.BENCH_RUNS ?? 3);
// 首屏时间即便取中位数也有 ±20%+ 波动（SW 安装与页面加载互相竞争），闸门需要容差
const TOLERANCE = Number(process.env.BENCH_TOLERANCE ?? 0.25);

const runs = [];
for (let i = 0; i < RUNS; i++) {
    runs.push(await run());
    if (i < RUNS - 1) process.stderr.write(`  run ${i + 2}/${RUNS}...\n`);
}

const medianOf = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
};

const numbers = {};
const report = {};
for (const [section, values] of Object.entries(runs[0])) {
    if (typeof values !== "object" || values === null) {
        report[section] = values;
        continue;
    }
    report[section] = {};
    for (const key of Object.keys(values)) {
        const samples = runs
            .map((r) => r[section]?.[key])
            .filter((v) => typeof v === "number");
        if (!samples.length) {
            report[section][key] = values[key];
            continue;
        }
        const median = medianOf(samples);
        numbers[`${section}.${key}`] = median;
        report[section][key] = median;
    }
}
report.runs = runs.length;
report.spread = Object.fromEntries(
    Object.keys(numbers).map((key) => {
        const [section, metric] = key.split(".");
        const samples = runs.map((r) => r[section][metric]);
        return [
            key,
            Math.round(
                ((Math.max(...samples) - Math.min(...samples)) /
                    medianOf(samples)) *
                    100,
            ),
        ];
    }),
);
console.log(JSON.stringify({ ...report, spread: undefined }, null, 2));
console.error(`\nworst metric spread across ${RUNS} runs:`);
for (const [key, pct] of Object.entries(report.spread)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5))
    console.error(`  ${key}: +/-${pct}%`);

const cjkCssLate = Math.max(...runs.map((r) => r.launch.cjkCssLate));
const cjkCssChunks = medianOf(runs.map((r) => r.launch.cjkCssChunks));
if (cjkCssChunks > 0 && cjkCssLate > 0) {
    console.error(
        `\nFAIL: ${cjkCssLate} 个 CJK 字族 CSS chunk 晚于首屏绘制到达，首屏中文会先显示系统字体再替换（FOUT）`,
    );
    process.exit(1);
}

if (SAVE) {
    await mkdir(join(ROOT, "bench"), { recursive: true });
    // 只更新 baseline 里已有的键，棘轮集合才不会自己膨胀
    const previous = existsSync(BASELINE)
        ? JSON.parse(await readFile(BASELINE, "utf8"))
        : numbers;
    const ratcheted = Object.fromEntries(
        Object.entries(previous).flatMap(([key, value]) =>
            typeof numbers[key] === "number"
                ? [[key, numbers[key]]]
                : [[key, value]],
        ),
    );
    await writeFile(BASELINE, `${JSON.stringify(ratcheted, null, 4)}\n`);
    console.error(
        `\nratcheted ${Object.keys(ratcheted).length} baselines -> bench/baseline.json`,
    );
    process.exit(0);
}

if (!existsSync(BASELINE)) {
    console.error(
        "\nno baseline yet — run `node scripts/bench.mjs --save` to record one",
    );
    process.exit(0);
}

const baseline = JSON.parse(await readFile(BASELINE, "utf8"));
const regressions = [];
for (const [key, ceiling] of Object.entries(baseline)) {
    const value = numbers[key];
    if (typeof value !== "number") continue;
    if (value > ceiling * (1 + TOLERANCE)) {
        regressions.push({ key, was: ceiling, now: value });
    }
}

const wins = Object.entries(baseline)
    .filter(
        ([key, ceiling]) =>
            typeof numbers[key] === "number" && numbers[key] < ceiling,
    )
    .map(([key, ceiling]) => ({ key, was: ceiling, now: numbers[key] }));

if (wins.length) {
    console.error(
        `\n${wins.length} metric(s) improved — lower the ratchet with --save:`,
    );
    for (const w of wins) console.error(`  ${w.key}: ${w.was} -> ${w.now}`);
}
if (regressions.length) {
    console.error(`\n${regressions.length} REGRESSION(S):`);
    for (const r of regressions)
        console.error(`  ${r.key}: ${r.was} -> ${r.now}`);
    process.exit(1);
}
console.error("\nno regressions");
