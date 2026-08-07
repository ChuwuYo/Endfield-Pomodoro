# 优化 TODO（推荐执行顺序）

> 来源：`docs/QUALITY_ASSESSMENT.md`（编号对应评估报告"待优化事项总表"第 # 列）
> 排序原则：**先修真实 Bug → 再建安全网（测试+CI）→ 然后低成本清理 → 再做有测试兜底的重构 → 最后打磨**。
> 前置项阻塞后置项：测试基建（阶段 2）必须先于重构（阶段 5）完成；统一消息系统已有专项计划见 `docs/TODO.md`。

---

## 阶段 0：正确性修复（立即做，无依赖）

- [x] **#1 SoundManager AudioContext 泄漏** —— 改为模块级单例 + 复用 `ctx`，蜂鸣结束 `osc.onended` 中释放节点；补充 `ctx.state === "suspended"` 时的 `resume()` 处理（autoplay 策略）。*S*

## 阶段 1：质量门禁（为一切后续改动兜底）

- [x] **#3 建立 CI** —— `.github/workflows/ci.yml`：pnpm install → lint → check → build。*S*
- [ ] **#2 测试基建** —— 引入 Vitest（+ @testing-library/react、jsdom/happy-dom），先覆盖纯逻辑：
  - [ ] `useShuffle`（洗牌不重不漏、循环重洗、首尾相接规避）
  - [ ] `asyncPool`（并发上限、结果保序、异常传播）
  - [ ] `musicApiAdapters.parseResponse`（字段回退、空数组抛错）
  - [ ] `SettingsPanel.parseDurationInput`、设置反序列化校验（与 #10 联动）
  - [ ] `Pomodoro` 状态机（完成流转、重置、跳过语义）——组件级，最后补
  - 将 `pnpm test` 挂入 CI。*L*

## 阶段 2：低成本清理（快速胜利，不改行为）

- [ ] **#13 移除未使用依赖** `lucide-react`、`react-use`。*S*
- [ ] **#14 删除死代码** `ui/Input.tsx` 的 `Select`（同步 ui/index.ts 导出）、`MikuForegroundLayer` 空渲染（TerminalUI 中 MIKU 分支一并处理）。*S*
- [ ] **#12 清理生产 console** —— 高频/调试日志改为 debug 级别或删除；Biome `noConsole` 规则可选开启（warn 级）。*S*
- [ ] **#33 移除无效兜底** `PWAPrompt.tsx` 的 `|| "Close"`。*S*
- [ ] **#38 魔法数字入 constants**（连续错误阈值 5、MAX_TASKS、循环等，同 #28 前半）。*S*
- [ ] **#30 修正注释数值不一致** `useFooterHeight.ts`。*S*
- [ ] **#29 裁剪未消费的 hook 返回字段**（useSessionStats / useShuffle）。*S*

## 阶段 3：无障碍阻断项（真实用户可感知）

- [ ] **#4 滑块可操作性** —— PlayerInterface 进度/音量条：mouse 事件 → Pointer Events（触屏可拖）；补 `role="slider"` + `aria-valuenow/min/max` + 方向键步进。*M*
- [ ] **#5 计时器 aria-live 降噪** —— 移除每秒播报；改为模式切换/完成时才播报状态。*S*
- [ ] **#7 `prefers-reduced-motion`** —— index.css 加媒体查询兜底（禁用 ping/spin/scan/rain/equalizer/data-flow 等常开动画）。*S*
- [ ] **#8 `html lang` 动态化** —— 语言切换时同步 `document.documentElement.lang`。*S*
- [ ] **#6 CustomSelect 键盘导航** —— ↑↓ 移动、Enter 选定、Escape 关闭、`aria-activedescendant`、焦点管理。*M*
- [ ] **#9 主题对比度审计** —— 对 9 套主题的 dim/text 组合跑 WCAG AA 检查，调整不达标变量值。*M*
- [ ] **#26 播放列表模态** —— Escape 关闭 + 焦点陷阱 + 背景滚动锁定。*S*
- [ ] **#27 label 关联** —— SettingsPanel 全部 label 补 `htmlFor`/控件补 `id`。*S*
- [ ] **#34 Button/全局 focus-visible 焦点环**；Button 按压态补 `:active` CSS（触屏反馈）。*S*

## 阶段 4：健壮性与安全

- [ ] **#10 设置反序列化深校验** —— 字段级类型/范围校验（workDuration ≥1 整数等），脏字段回退默认值；复用 TaskManager 的校验写法。*S*
- [ ] **#24 Error Boundary** —— 根部包一层错误边界 + 兜底 UI（PWA 白屏恢复路径）。*S*
- [ ] **#22 API URL 参数编码** —— `buildUrl`/`buildTrackUrl` 中 `id`/`server`/`type` 经 `encodeURIComponent`（或 URLSearchParams）。*S*
- [ ] **#23 CSP** —— 评估并添加 Content-Security-Policy（注意 Google Fonts 与第三方音频域白名单）。*S*
- [ ] **#11 落地统一消息系统** —— 按 `docs/TODO.md` 既定计划执行（替换 alert/MessageDisplay/PWAPrompt 提示）。*M*

## 阶段 5：重构（依赖阶段 1 的测试兜底）

- [ ] **#17 合并 PlayMode/AudioMode** —— 统一为单枚举，删除两份 `mapPlayMode`（保留 never 穷尽检查版语义）。*S*
- [ ] **#18 统一 musicConfig 契约** —— `Settings.musicConfig` 直接引用 `MusicConfig` 类型。*S*
- [ ] **#19 THEMES 键类型收紧** —— 抽出 `ThemeColors` 接口（10 个 `--color-*` 键必填）。*S*
- [ ] **#21 Pomodoro 重置语义收敛** —— 消除 `lastResetKeyRef` 签名 hack 与 4 处 exhaustive-deps 豁免，改为显式事件驱动。*M*
- [ ] **#20 useOnlinePlayer 重构** —— 按源码注释既定方向：音频实例改 ref + 版本号 state，移除 `"use no memo"` 与 ESLint 豁免。*L*
- [ ] **#25 抽取 `fetchWithTimeout`** —— 消除 useMusicData 中两处重复。*S*
- [ ] **#36 TerminalUI 主题注册表化** —— switch → `Record<ThemePreset, FC>` 映射。*S*

## 阶段 6：性能与工程打磨

- [ ] **#15 App 重渲染隔离** —— 时钟状态下沉到 HeaderBar 内部（或独立 Clock 组件）；`useTranslation` 返回用 `useCallback` 稳定化。*S*
- [ ] **#16 music-metadata 动态导入** —— `addFiles` 内 `await import("music-metadata")`，移出主包。*S*
- [ ] **#31 Google Fonts 加载优化** —— CSS `@import` → index.html `preconnect` + `<link>`，或自托管字体。*S*
- [ ] **#37 bundle 可视化 + 体积预算** —— 接入 rollup-plugin-visualizer，CI 加体积门禁。*S*
- [ ] **#35 标题模式标签走 i18n** —— 新增 `MODE_BREAK_SHORT` 键替代内联三元。*S*
- [ ] **#32 keyframes 收敛** —— 重复 `scan` 及散落 `<style>` 统一迁入 index.css。*S*
- [ ] **#28 后半 任务 id** —— `Date.now()` → `crypto.randomUUID()`。*S*
- [ ] **#39 统计语义确认** —— sessionStorage vs localStorage 的"累计时长"语义，确认后写入 README/注释。*S*
- [ ] **#40 CHANGELOG.md** —— 建立变更记录（可从 git tag 历史回填）。*S*

---

### 完成判定（每阶段）

- 每阶段结束：`pnpm lint && pnpm check && pnpm build` 全绿；阶段 1 起增加 `pnpm test` 全绿
- 阶段 3 结束：键盘可完成"选择主题/语言/拖拽进度/调节音量"全流程；屏幕阅读器不再被计时器刷屏
- 阶段 5 结束：`eslint.config.js` 中 useOnlinePlayer 豁免块删除、`"use no memo"` 移除
- 行为变更需在 PR 描述中附最小验证说明（AGENTS.md Done Criteria）
