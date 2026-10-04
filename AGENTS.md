# AGENTS.md

## Project
- Name: endfield-pomodoro
- Stack: React 19 + TypeScript + Vite + TailwindCSS v4
- Goal: Pomodoro timer with theme system, i18n, and music playback.

## Runbook
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Check: `pnpm check`
- Test: `pnpm test`
- Perf gate: `pnpm bench` (needs `pnpm build` first; `--save` via `pnpm bench:save` to lower the ratchet)

## Source Map
- App entry: `src/main.tsx`, `src/App.tsx`
- Core components: `src/components/`
- Theme config: `src/config/themes.ts`
- i18n: `src/utils/i18n.ts`
- CJK webfonts: `src/utils/cjkFont.ts` (per-language dynamic import)
- Music config: `src/config/musicConfig.ts`
- Types/constants: `src/types.ts`, `src/constants.ts`
- Perf harness: `scripts/bench.mjs` + `bench/baseline.json`

## Change Rules
- Keep TypeScript types strict; update `src/types.ts` when contracts change.
- Reuse existing component layering: `components/ui`, `components/themes`, business components.
- For UI text changes, update all locale entries in `src/utils/i18n.ts` (zh-CN/zh-TW/en/ja/ko).
- For theme changes, prefer CSS variables and centralized config in `src/config/themes.ts`.
- Fonts are self-hosted via `@fontsource/*`; never reintroduce a third-party font
  stylesheet. Adding a language means adding its family to `src/utils/cjkFont.ts`.
- Keep `vite.config.ts` precache lean: exclude large dead assets (`globIgnores`) and
  watch `assets.precacheKB` in `pnpm bench`.
- Do not introduce unrelated refactors in feature/fix tasks.

## Done Criteria
- Relevant commands pass: `pnpm lint` & `pnpm check`.
- If behavior changed, include/update minimal tests or verification notes.
- Run `pnpm bench` for perf-sensitive changes. Absolute timings are machine-specific, so
  this stays a local gate — never add it to CI as a blocking check. Machine-independent
  metrics (`assets.precacheKB`, `launch.domNodes`, `launch.cjkCssLate`) are the exceptions.
- Keep diffs focused and document key decisions in PR/task notes.
