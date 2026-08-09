#!/usr/bin/env node
/**
 * Fail CI when the main entry JS gzip size exceeds the budget.
 *
 * Baseline (main @ 2026-08-09, after stage-6 load/render work):
 *   dist/assets/index-*.js ≈ 331_165 raw / 101_261 gzip(-9)
 *
 * Budget keeps ~18% headroom for routine dependency bumps without
 * gating async chunks (e.g. music-metadata `core-*.js`) or CSS/assets.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const MAIN_JS_GZIP_BUDGET_BYTES = 120_000;

const assetsDir = path.join("dist", "assets");
if (!fs.existsSync(assetsDir)) {
    console.error(`Missing ${assetsDir}. Run \`pnpm build\` first.`);
    process.exit(1);
}

const mains = fs
    .readdirSync(assetsDir)
    .filter((name) => /^index-.*\.js$/.test(name));

if (mains.length !== 1) {
    console.error(
        `Expected exactly one main entry (index-*.js), found: ${
            mains.join(", ") || "(none)"
        }`,
    );
    process.exit(1);
}

const fileName = mains[0];
const filePath = path.join(assetsDir, fileName);
const raw = fs.readFileSync(filePath);
const gzipped = zlib.gzipSync(raw, { level: 9 });

const report = `${fileName}: raw=${raw.length} gzip9=${gzipped.length} budget=${MAIN_JS_GZIP_BUDGET_BYTES}`;
if (gzipped.length > MAIN_JS_GZIP_BUDGET_BYTES) {
    console.error(`Bundle budget exceeded — ${report}`);
    process.exit(1);
}

console.log(`Bundle budget OK — ${report}`);
