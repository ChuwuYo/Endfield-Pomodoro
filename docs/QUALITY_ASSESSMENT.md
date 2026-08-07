# Endfield-Pomodoro 项目质量评估报告

> 评估日期：2026-08-08 ｜ 版本：v0.7.6 ｜ 代码规模：~6,700 行（src/，40 个 TS/TSX 文件）
> 验证状态：`pnpm lint` ✅ 通过 ｜ `pnpm check` ✅ 通过 ｜ `pnpm build` ✅ 通过（主包 414.74 kB / gzip 126.28 kB，precache 4.84 MB）

---

## 一、总体评价

**综合评分：7.4 / 10** —— 工程质量中上，工具链现代化且全部校验通过；性能优化意识突出（大量合成器动画改造并有详细注释）；最大短板是**零测试**与**无障碍（a11y）系统性缺失**。

项目亮点：

- 现代化的工具链：React 19 + React Compiler + Vite 8 + Tailwind v4 + Biome/ESLint 双校验，全部通过
- 清晰的组件分层：`components/ui` → `components/themes` → 业务组件 → `App`
- 优秀的性能工程：鼠标跟随效果全部改为 ref 直写 transform（纯合成器）、音频预加载实例交换（无缝切歌）、`timeupdate` 节流、music-metadata 按解析器自动分包
- 详实的中文注释，关键 hack（如 `lastResetKeyRef`、`"use no memo"`）均记录了原因与移除条件
- i18n 双语键值完全对齐（EN/CN 各 109 键，经脚本验证零漂移）
- PWA 配置成熟：autoUpdate、NetworkFirst index.html、字体 CacheFirst、音频 NetworkOnly 绕过

核心风险：

- **零测试**：无任何测试文件、无测试框架依赖；计时器状态机、洗牌逻辑等高复杂度逻辑无回归保障
- **无 CI**：无 `.github/workflows`，质量门禁仅靠本地自觉
- **无障碍债务**：进度条/音量条仅支持鼠标拖拽（触屏无法拖动）、CustomSelect 无键盘导航、计时器 `aria-live` 每秒播报骚扰屏幕阅读器、全站未响应 `prefers-reduced-motion`
- **一个真实资源泄漏 Bug**：SoundManager 每次蜂鸣新建 `AudioContext` 且从不关闭

---

## 二、维度评分

| 维度 | 评分 | 简评 |
|---|---|---|
| 架构与代码组织 | 8.0 | 分层清晰、hooks 抽取合理、适配器模式优雅；扣分：`PlayMode`/`AudioMode` 双枚举重复、`musicConfig` 类型两处定义不一致、App.tsx 承载过多职责 |
| TypeScript 严格性 | 8.5 | strict + noUnusedLocals + verbatimModuleSyntax + erasableSyntaxOnly 全开；扣分：`THEMES` 为 `Record<string, string>` 键未约束、localStorage 设置仅浅校验 |
| 性能 | 8.0 | 合成器动画改造、预加载交换、节流、分包均有实证；扣分：App 级每秒全树重渲染（时钟）、music-metadata 静态打入主包、无 reduced-motion |
| 无障碍 (a11y) | 4.5 | 部分按钮有 aria-label/title；但滑块无键盘/触屏支持、listbox 键盘导航缺失、aria-live 滥用、对比度未审计、micro 字号（8-10px）大量使用 |
| 测试 | 0.0 | 无测试框架、无测试文件、无 CI 测试门禁 |
| 构建与工具链 | 9.0 | lint/check/build 全绿，React Compiler 接入规范；扣分：无 CI、2 个未使用依赖、54 处 console 调用进生产包 |
| 安全性 | 6.0 | 无密钥泄露、referrer no-referrer；扣分：无 CSP、API URL 参数未 `encodeURIComponent`、设置反序列化无字段级校验 |
| 国际化 (i18n) | 9.0 | 键值类型安全、双语零漂移；扣分：`html lang` 静态写死 zh-CN、`App.tsx` 内联硬编码"休息/Break"未走 i18n |
| 错误处理与韧性 | 6.5 | API 适配器故障转移 + AbortController 管理 + storage 配额处理完善；扣分：错误大多仅 console、遗留 `alert()`、无 React Error Boundary、统一消息系统仅在规划中 |
| PWA / 离线 | 8.5 | workbox 配置细致、断网自动切本地播放并提示恢复；扣分：无离线分析/安装指标 |
| 文档与注释 | 8.0 | AGENTS.md + README + 高密度高质注释 + docs/TODO.md；扣分：无架构决策记录（ADR）、无 CHANGELOG |

---

## 三、组件级评分

| 组件 / 模块 | 行数 | 评分 | 主要问题 |
|---|---:|---:|---|
| `App.tsx` | 273 | 7.5 | 设置浅合并无字段校验；每秒 interval 触发整树重渲染；标题"休息/Break"硬编码；tempMusicConfig 与 settings 单向同步 |
| `Pomodoro.tsx` | 508 | 7.0 | `lastResetKeyRef` 签名 hack 脆弱；4 处 eslint-disable；`aria-live` 每秒播报；跳过即计为完成（产品语义待确认） |
| `TaskManager.tsx` | 189 | 8.5 | 反序列化校验规范；`MAX_TASKS` 硬编码未入 constants；`Date.now()` 作 id 有同毫秒碰撞风险 |
| `AudioPlayer.tsx` | 374 | 7.5 | Portal 播放列表无焦点陷阱/Escape 关闭；`mapPlayMode` 与 MusicPlayer 重复 |
| `MusicPlayer.tsx` | 264 | 7.5 | `mapPlayMode` 重复且 default 分支未做 never 穷尽检查（与 AudioPlayer 版本不一致）；console.log 残留 |
| `PlayerInterface.tsx` | 429 | 6.5 | 进度/音量拖拽仅 mouse 事件（触屏不可拖）；滑块无 role/键盘操作；`volumeBarRef.current!` 非空断言 |
| `SettingsPanel.tsx` | 378 | 7.5 | 遗留原生 `alert()`；label 未与控件关联（无 htmlFor/id）；数字输入无范围上限 |
| `hooks/useOnlinePlayer.ts` | 684 | 6.5 | React Compiler 显式退出（`"use no memo"`）+ ESLint 豁免，已自证为技术债；音频实例存 state 的 Swap 模式复杂脆弱；复杂度过高 |
| `hooks/useLocalPlayer.ts` | 547 | 8.0 | Blob URL 生命周期管理严谨；`parseBlob` 静态导入致 music-metadata 核心进主包 |
| `hooks/useMusicData.ts` | 254 | 8.0 | 超时/中止/转移管理完善；`fetchData` 与 `fetchTrackUrl` 中 Promise.race 超时模式重复可抽取 |
| `hooks/useShuffle.ts` | 144 | 8.5 | 纯逻辑、高可测性、首尾相接处理细致；返回的 `shuffledIndices`/`shufflePointer` 未被消费 |
| `hooks/useSessionStats.ts` | 184 | 7.5 | 返回字段 `accumulatedSeconds`/`elapsedSeconds`/`totalSeconds` 未被使用；统计数据仅存 sessionStorage（跨会话归零，语义需在文档中明确） |
| `SoundManager.tsx` | 75 | 5.5 | **每次蜂鸣新建 AudioContext 且从不 `close()`**——累积后触发浏览器上下文数量上限；未处理 autoplay 策略下 suspended 状态 |
| `themes/BackgroundEffects.tsx` | 274 | 8.5 | 性能注释极佳；`<style>` 标签内联 keyframes 散落，与 index.css 约定不一 |
| `themes/ForegroundEffects.tsx` | 226 | 8.5 | ref 直写 transform 规范统一；`scan` keyframes 在 Abyssal/Azure 两处重复注入 |
| `themes/MikuDecorations.tsx` | 264 | 8.0 | data-URL 贴图优化出色；`MikuForegroundLayer` 为空渲染（死代码） |
| `TerminalUI.tsx` | 96 | 8.0 | switch 分发可改为配置映射，新增主题需改三处 |
| `ui/Button.tsx` | 37 | 8.0 | 按压态仅 mouse 事件（触屏无反馈，可用 :active 替代）；无 focus-visible 样式 |
| `ui/Input.tsx` (+Select) | 29 | 6.5 | `Select` 导出后全站零引用（死代码）；className 同时作用于 wrapper 与 spread 的语义易误用 |
| `ui/Panel.tsx` | 30 | 8.0 | 装饰性元素未加 `aria-hidden` |
| `CustomSelect.tsx` | 96 | 6.0 | 无键盘导航（方向键/Escape/Enter）、无焦点管理、listbox ARIA 不完整 |
| `Checkbox.tsx` | ~80 | 7.5 | sr-only 原生 input 处理正确；装饰点未 aria-hidden |
| `MessageDisplay.tsx` | 42 | 7.0 | 已列入统一消息系统替换计划（docs/TODO.md） |
| `PWAPrompt.tsx` | 145 | 8.0 | 逻辑稳健；console.log 残留；`t("pwa_close") \|\| "Close"` 为无效兜底（t 自带 key 兜底） |
| `HeaderBar.tsx` | 136 | 8.5 | 干净；时钟数据由 App 下传导致被动参与每秒重渲染 |
| `FooterStats.tsx` | 94 | 8.0 | 良好 |
| `utils/i18n.ts` | 274 | 9.0 | 类型安全、双语对齐；`t` 每次渲染返回新闭包（被 effect 依赖时造成重复订阅） |
| `utils/musicApiAdapters.ts` | 80 | 7.5 | URL 参数（用户可输入的 `id`）未 `encodeURIComponent`；扩展点文档清晰 |
| `utils/asyncPool.ts` | ~35 | 8.5 | 实现正确、通用、高可测性 |
| `config/themes.ts` | 116 | 8.5 | 集中管理符合约定；`Record<string, string>` 未约束键集合，漏键/错键无编译期报错 |
| `config/musicConfig.ts` | 28 | 8.0 | `MusicConfig`（严格字面量）与 `types.ts` 中 `Settings.musicConfig`（宽 string）双份契约不一致 |
| `constants.ts` | 94 | 9.0 | 常量集中、注释含使用位置索引，是全项目范本 |
| `vite.config.ts` (PWA) | 108 | 8.5 | workbox 策略细致；无 bundle 可视化分析配置 |
| `index.html` / `index.css` | 364 | 7.5 | Google Fonts 经 CSS `@import` 加载（阻塞渲染、无 preconnect）；FOUC 防护注释清晰 |

---

## 四、待优化事项总表

> 严重度：🔴 高（正确性/资源/阻断性）｜🟠 中（体验/一致性/明显债务）｜🟡 低（打磨项）
> 工作量：S < 0.5 天 ｜ M 0.5–2 天 ｜ L > 2 天

| # | 位置 | 问题描述 | 类别 | 严重度 | 工作量 |
|---|---|---|---|---|---|
| 1 | `SoundManager.tsx:20` | 每次蜂鸣 `new AudioContext()` 且从不 `close()`，长期运行耗尽浏览器音频上下文配额；未处理 suspended 自动播放策略 | Bug | 🔴 | S |
| 2 | 全项目 | 零测试：无 Vitest/Jest，计时器状态机、useShuffle、asyncPool、parseResponse、设置迁移等核心逻辑无回归保障 | 测试 | 🔴 | L |
| 3 | 仓库根 | 无 CI（无 `.github/workflows`），lint/check/build 依赖本地自觉 | 工具链 | 🔴 | S |
| 4 | `PlayerInterface.tsx:110-168,374-422` | 进度条/音量条仅监听 mouse 事件，触屏无法拖拽；滑块无 `role="slider"`/`aria-valuenow`/键盘方向键支持 | a11y | 🔴 | M |
| 5 | `Pomodoro.tsx:453-454` | 计时文本 `aria-live="polite"` 每秒变化，屏幕阅读器被持续打断（应移除外层或改为按需播报） | a11y | 🔴 | S |
| 6 | `CustomSelect.tsx` | 无键盘导航（↑↓/Enter/Escape）、无焦点循环、listbox ARIA 不完整（缺 `aria-activedescendant`） | a11y | 🟠 | M |
| 7 | `src/index.css` + 各动画 | 全站未响应 `prefers-reduced-motion`（数字雨/频谱条/ping/扫描线/数据流等均常开） | a11y | 🟠 | S |
| 8 | `index.html:2` | `<html lang="zh-CN">` 静态写死，切换英文时不更新（影响屏幕阅读器发音与 SEO） | a11y/i18n | 🟠 | S |
| 9 | `config/themes.ts` 多主题 | `--color-dim` 对比度疑似不足（如 ROYAL `#6b21a8` on `#100c19`、TACTICAL `#57534e` on `#1c1917`），需 WCAG 对比度审计 | a11y | 🟠 | M |
| 10 | `App.tsx:48-75` | localStorage 设置仅浅校验（仅判断是否对象），字段类型/范围不校验：脏数据（如 `workDuration: "abc"`）直接进入运行时 | 健壮性 | 🟠 | S |
| 11 | `SettingsPanel.tsx:281` | 通知权限被拒使用原生 `alert()`；已有统一消息系统规划（docs/TODO.md）待落地 | UX/一致性 | 🟠 | M |
| 12 | 全项目（54 处） | 生产代码残留 `console.log/warn/error`，含 PWA 轮询、播放器状态等高频日志 | 代码质量 | 🟠 | S |
| 13 | `package.json` | `lucide-react`、`react-use` 两个依赖全站零引用（图标实际用 remixicon） | 依赖卫生 | 🟠 | S |
| 14 | `ui/Input.tsx:18-28`、`MikuDecorations.tsx:202-208` | 死代码：`Select` 组件零引用；`MikuForegroundLayer` 渲染空固定定位 div | 代码质量 | 🟠 | S |
| 15 | `App.tsx:185-199` + `HeaderBar.tsx` | 每秒 `setNow` 触发 App 整树重渲染（时钟只需局部更新）；`t` 闭包每秒新建致 title effect 重复订阅 | 性能 | 🟠 | S |
| 16 | `useLocalPlayer.ts:1` | `music-metadata` 静态导入进主包（126KB gzip 的一部分），仅本地模式用到，应动态导入 | 性能 | 🟠 | S |
| 17 | `types.ts:14-19,40-45` + `AudioPlayer/MusicPlayer` | `PlayMode` 与 `AudioMode` 语义重叠的双枚举 + 两份 `mapPlayMode`（且 MusicPlayer 版 default 未穷尽检查） | 一致性 | 🟠 | S |
| 18 | `types.ts:58-62` vs `config/musicConfig.ts` | `Settings.musicConfig`（宽 string）与 `MusicConfig`（字面量联合）双份契约漂移 | 类型 | 🟠 | S |
| 19 | `config/themes.ts:7` | `THEMES: Record<ThemePreset, Record<string, string>>` 内层键未约束，漏配/错配变量名编译期不报错 | 类型 | 🟠 | S |
| 20 | `useOnlinePlayer.ts`（整体） | 音频实例存 state + `"use no memo"` + ESLint 豁免的 Swap 模式，684 行高复杂度；源码注释已给出重构方向（ref + 版本号 state） | 技术债 | 🟠 | L |
| 21 | `Pomodoro.tsx:123-128,243-255` | `lastResetKeyRef` 签名比较 hack + 4 处 exhaustive-deps 豁免；重置语义应收敛为显式事件 | 技术债 | 🟠 | M |
| 22 | `utils/musicApiAdapters.ts:34,38,62,66` | 用户可输入的 `id` 直接拼接进 URL 查询串，未 `encodeURIComponent` | 安全 | 🟠 | S |
| 23 | `index.html` | 无 CSP（Content-Security-Policy）meta/头 | 安全 | 🟡 | S |
| 24 | 无 React Error Boundary | 任一组件渲染抛错即白屏（PWA 场景下无恢复路径） | 健壮性 | 🟠 | S |
| 25 | `useMusicData.ts:106-117,200-211` | `fetchData` 与 `fetchTrackUrl` 中"Promise.race + 超时中止"模式重复，可抽取 `fetchWithTimeout` | DRY | 🟡 | S |
| 26 | `AudioPlayer.tsx:217-367` | Portal 播放列表模态无焦点陷阱、无 Escape 关闭、背景滚动未锁定 | a11y/UX | 🟡 | S |
| 27 | `SettingsPanel.tsx:66-122` 等 | `<label>` 与输入控件无 `htmlFor`/`id` 关联（点击标签不聚焦控件，读屏不关联） | a11y | 🟡 | S |
| 28 | `TaskManager.tsx:12,57` | `MAX_TASKS=6` 硬编码未入 `constants.ts`（违反项目约定）；`Date.now()` 作任务 id 存在同毫秒碰撞风险 | 约定 | 🟡 | S |
| 29 | `useSessionStats.ts:170-184`、`useShuffle.ts:137-143` | 返回值存在未消费字段（`accumulatedSeconds`/`elapsedSeconds`/`totalSeconds`、`shuffledIndices`/`shufflePointer`），API 表面冗余 | 代码质量 | 🟡 | S |
| 30 | `useFooterHeight.ts:39` | `getThemeExtraSpacing` 注释与实现数值不一致（注释写 12px，实现 Miku 120/其他 60） | 文档 | 🟡 | S |
| 31 | `index.css:1` | Google Fonts 经 CSS `@import` 串行加载（阻塞渲染）；建议改 `<link rel="preconnect">` + `<link rel="stylesheet">` 或自托管 | 性能 | 🟡 | S |
| 32 | `themes/*Foreground.tsx` | `scan` keyframes 在 Abyssal/Azure 两处 `<style>` 重复注入；keyframes 散落组件内联，与 index.css 集中约定不一 | DRY | 🟡 | S |
| 33 | `PWAPrompt.tsx:135-136` | `t("pwa_close") \|\| "Close"` 无效兜底（t 已实现 key 兜底） | 代码质量 | 🟡 | S |
| 34 | `ui/Button.tsx` | 按压缩放仅 mouse 事件（触屏无反馈）；全站缺 `:focus-visible` 焦点环样式 | a11y | 🟡 | S |
| 35 | `App.tsx:148` | 标题模式标签 `"休息"/"Break"` 内联三元硬编码，未走 i18n 键 | i18n | 🟡 | S |
| 36 | `TerminalUI.tsx` | 主题→效果组件的 switch 分发可改为 `Record<ThemePreset, Component>` 映射，新增主题只需注册一处 | 可维护性 | 🟡 | S |
| 37 | 构建产物 | 主包 414KB 未做 bundle 可视化分析（如 `rollup-plugin-visualizer`）；无预算门禁 | 工具链 | 🟡 | S |
| 38 | `useOnlinePlayer.ts:294` | 连续错误阈值 `5` 等魔法数字未入 constants（NEXT_TRACK_RETRY 等已在，遗漏此项） | 约定 | 🟡 | S |
| 39 | 统计语义 | sessionStorage 存统计导致跨标签页/重启浏览器归零，与"累计学习时长"语义存在产品层面歧义，需确认或文档化 | 产品 | 🟡 | S |
| 40 | 仓库 | 无 CHANGELOG.md；版本号已 0.7.6 但变更历史只在 git log | 文档 | 🟡 | S |

---

## 五、结论

代码库的**实现质量显著高于平均水平**：性能优化有据可查、注释即文档、常量与适配器管理规范。当前最大的边际收益来自三件事——**(1) 建立测试与 CI 安全网**（为后续重构兜底）、**(2) 修复 SoundManager 资源泄漏与 a11y 阻断项**（真实用户可感知）、**(3) 清理依赖卫生与死代码**（低成本高回报）。详细执行顺序见 `docs/OPTIMIZATION_TODO.md`。
