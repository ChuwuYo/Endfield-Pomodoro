import { useMemo } from "react";

// Perlin 梯度噪声：随机置换表 + 五次淡入淡出插值
const makePerlin = (seed: number) => {
    let s = seed >>> 0;
    const next = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
    const base = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [base[i], base[j]] = [base[j], base[i]];
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const grad = (hash: number, x: number, y: number) => {
        const h = hash & 7;
        const u = h < 4 ? x : y;
        const v = h < 4 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? 2 * v : -2 * v);
    };
    return (x: number, y: number) => {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const X = xi & 255;
        const Y = yi & 255;
        const u = fade(x - xi);
        const v = fade(y - yi);
        return lerp(
            lerp(
                grad(perm[perm[X] + Y], x - xi, y - yi),
                grad(perm[perm[X + 1] + Y], x - xi - 1, y - yi),
                u,
            ),
            lerp(
                grad(perm[perm[X] + Y + 1], x - xi, y - yi - 1),
                grad(perm[perm[X + 1] + Y + 1], x - xi - 1, y - yi - 1),
                u,
            ),
            v,
        );
    };
};

const perlinTerrain = makePerlin(20261008);
const perlinWarp = makePerlin(777);

const OCTAVES = 5;
const PERSISTENCE = 0.5;

/** 分形布朗运动：多倍频叠加，刻画起伏的大结构 */
const fbm = (x: number, y: number) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < OCTAVES; i++) {
        sum += perlinTerrain(x * freq, y * freq) * amp;
        norm += amp;
        amp *= PERSISTENCE;
        freq *= 2;
    }
    return sum / norm / 2 + 0.5;
};

/** 山脊多倍频：1-|噪声| 平方后按上一倍频加权，出锋利山脊与 V 形谷 */
const ridged = (x: number, y: number) => {
    let sum = 0;
    let freq = 1;
    let amp = 0.5;
    let weight = 1;
    for (let i = 0; i < OCTAVES; i++) {
        let n = 1 - Math.abs(perlinTerrain(x * freq + 13.7, y * freq - 4.2));
        n *= n * weight;
        weight = Math.min(1, Math.max(0, n * 2));
        sum += n * amp;
        amp *= 0.5;
        freq *= 2.03;
    }
    return Math.min(1, sum / 1.6);
};

const RIDGE_MIX = 0.55;

/** 域扭曲 + fBm/山脊混合，得到有地貌逻辑的高度场 */
const terrainAt = (u: number, v: number) => {
    const wx = perlinWarp(u * 1.6, v * 1.6) * 0.35;
    const wy = perlinWarp(u * 1.6 + 5.2, v * 1.6 + 1.3) * 0.35;
    const x = (u + wx) * 1.4;
    const y = (v + wy) * 1.4;
    return fbm(x, y) * (1 - RIDGE_MIX) + ridged(x, y) * RIDGE_MIX;
};

// marching squares：每格线性插值求交点，返回该档位的线段端点
const marchingSquares = (
    grid: Float32Array,
    res: number,
    level: number,
): [number, number, number, number][] => {
    const segs: [number, number, number, number][] = [];
    const at = (x: number, y: number) => grid[y * (res + 1) + x];
    for (let y = 0; y < res; y++) {
        for (let x = 0; x < res; x++) {
            const v0 = at(x, y);
            const v1 = at(x + 1, y);
            const v2 = at(x + 1, y + 1);
            const v3 = at(x, y + 1);
            let idx = 0;
            if (v0 > level) idx |= 1;
            if (v1 > level) idx |= 2;
            if (v2 > level) idx |= 4;
            if (v3 > level) idx |= 8;
            if (idx === 0 || idx === 15) continue;
            const lerp = (a: number, b: number) => (level - a) / (b - a);
            const top: [number, number] = [x + lerp(v0, v1), y];
            const right: [number, number] = [x + 1, y + lerp(v1, v2)];
            const bottom: [number, number] = [x + lerp(v3, v2), y + 1];
            const left: [number, number] = [x, y + lerp(v0, v3)];
            const seg = (a: [number, number], b: [number, number]) =>
                segs.push([a[0], a[1], b[0], b[1]]);
            switch (idx) {
                case 1:
                case 14:
                    seg(left, top);
                    break;
                case 2:
                case 13:
                    seg(top, right);
                    break;
                case 3:
                case 12:
                    seg(left, right);
                    break;
                case 4:
                case 11:
                    seg(right, bottom);
                    break;
                case 6:
                case 9:
                    seg(top, bottom);
                    break;
                case 7:
                case 8:
                    seg(left, bottom);
                    break;
            }
        }
    }
    return segs;
};

// 散段拼成连续折线：端点哈希配对后逐条追踪
const stitchSegments = (
    segs: [number, number, number, number][],
    scale: number,
): string[] => {
    const key = (x: number, y: number) =>
        `${Math.round(x * 64)},${Math.round(y * 64)}`;
    const edgesOf = new Map<string, number[]>();
    segs.forEach((s, i) => {
        for (const k of [key(s[0], s[1]), key(s[2], s[3])]) {
            const list = edgesOf.get(k);
            if (list) list.push(i);
            else edgesOf.set(k, [i]);
        }
    });
    const used = new Uint8Array(segs.length);
    const paths: string[] = [];
    for (let e0 = 0; e0 < segs.length; e0++) {
        if (used[e0]) continue;
        used[e0] = 1;
        const start = segs[e0];
        const pts: string[] = [
            `${(start[0] * scale).toFixed(1)},${(start[1] * scale).toFixed(1)}`,
        ];
        let cx = start[2];
        let cy = start[3];
        for (;;) {
            pts.push(`${(cx * scale).toFixed(1)},${(cy * scale).toFixed(1)}`);
            const candidates = edgesOf.get(key(cx, cy)) ?? [];
            const next = candidates.find((i) => !used[i]);
            if (next === undefined) break;
            used[next] = 1;
            const s = segs[next];
            const forward = key(s[0], s[1]) === key(cx, cy);
            cx = forward ? s[2] : s[0];
            cy = forward ? s[3] : s[1];
        }
        if (pts.length > 3) {
            // 丢弃过短的碎片：两端都没到图幅边缘的多是噪声刮痕
            const xs = pts.map((p) => Number(p.slice(0, p.indexOf(","))));
            const ys = pts.map((p) => Number(p.slice(p.indexOf(",") + 1)));
            const span =
                Math.max(...xs) -
                Math.min(...xs) +
                (Math.max(...ys) - Math.min(...ys));
            const touchesEdge =
                Math.min(...xs) <= 0.5 ||
                Math.min(...ys) <= 0.5 ||
                Math.max(...xs) >= scale * 160 - 0.5 ||
                Math.max(...ys) >= scale * 160 - 0.5;
            if (span > 6 || touchesEdge) paths.push(`M${pts.join("L")}`);
        }
    }
    return paths;
};

// Chaikin 切角：消掉 marching squares 网格留下的尖角与台阶，端点保留
const smoothPolylines = (paths: string[]): string[] =>
    paths.flatMap((path) => {
        const pts = path
            .slice(1)
            .split("L")
            .map((p) => p.split(",").map(Number));
        if (pts.length < 3) return [path];
        const out = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const [ax, ay] = pts[i];
            const [bx, by] = pts[i + 1];
            out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
            out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
        }
        out.push(pts[pts.length - 1]);
        return [
            `M${out
                .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
                .join("L")}`,
        ];
    });

// 地形网格 + 等高线分层：普通线 / 每四条一条计曲线，只算一次
const buildContours = () => {
    const RES = 160;
    const grid = new Float32Array((RES + 1) * (RES + 1));
    let lo = Infinity;
    let hi = -Infinity;
    for (let y = 0; y <= RES; y++) {
        for (let x = 0; x <= RES; x++) {
            const h = terrainAt(x / RES, y / RES);
            grid[y * (RES + 1) + x] = h;
            if (h < lo) lo = h;
            if (h > hi) hi = h;
        }
    }
    for (let i = 0; i < grid.length; i++) grid[i] = (grid[i] - lo) / (hi - lo);
    const normal: string[] = [];
    const index: string[] = [];
    const LEVELS = 9;
    for (let i = 0; i < LEVELS; i++) {
        const level = 0.14 + ((i + 1) / LEVELS) * 0.72;
        const paths = smoothPolylines(
            stitchSegments(marchingSquares(grid, RES, level), 1000 / RES),
        );
        (i % 4 === 3 ? index : normal).push(...paths);
    }
    return { normal, index };
};

/** TACTICAL 背景层：细密点阵 + 地形等高线（中心留空、四边压暗）。 */
export const TacticalGrid = () => {
    const { normal, index } = useMemo(() => buildContours(), []);
    return (
        <>
            <div className="tactical-dot-grid absolute inset-0"></div>
            <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
            >
                <g className="tactical-contours tactical-contours--line">
                    {normal.map((d, i) => (
                        <path key={i} d={d} />
                    ))}
                </g>
                <g className="tactical-contours tactical-contours--index">
                    {index.map((d, i) => (
                        <path key={i} d={d} />
                    ))}
                </g>
            </svg>
            <div className="tactical-contour-veil absolute inset-0 pointer-events-none"></div>
        </>
    );
};
