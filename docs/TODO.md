# 通知与状态通道（架构说明 + 落地清单）

> 对应 `docs/OPTIMIZATION_TODO.md` 专项 **#11**。  
> 本文是现行架构结论，取代早期「一锅炖 MessageSystem」草案。

## 第一性原理

用户看到的「提示」不是同一种东西。把语义不同的通道捏成一个大框架，会破坏归属边界、a11y 语义和生命周期。

按**谁拥有反馈、用户期望在哪里看到它、生命周期由谁结束**划分通道：

| 通道 | 语义 | 现状 | 决策 |
| --- | --- | --- | --- |
| **全局短暂通知（Toast）** | 与当前面板无强绑定；出现后自动消失或可关闭 | `alert()`（通知权限被拒）；AudioPlayer 网络恢复 + `MessageDisplay` | **统一**：单一 Toast 宿主与 API |
| **上下文状态（Inline status）** | 占据业务区域，描述「这一块现在怎样」 | MusicPlayer 全屏 `CONNECTING` / 错误块；PlayerInterface 顶栏 loading 文案 | **保持内联**；可抽共享展示组件，但**不进全局队列** |
| **系统通知（OS Notification）** | 标签页外、系统级打断 | Pomodoro `new Notification(...)` | **保持** Web Notification；失败可降级为一次 Toast，不反向吞并 OS 通道 |
| **PWA 更新提示** | 绑定 Service Worker / controllerchange | `PWAPrompt` 右下角条 | **逻辑留在 PWAPrompt**；视觉可复用 Toast 部件，禁止为「统一」重写 SW |
| **崩溃恢复** | 渲染树已不可用 | `ErrorBoundary` | **保持独立**；不属于消息队列 |

错误原则：

- 原生 `alert` / `confirm` / `prompt` 在生产 UI 中不可接受（阻塞主线程、不可主题化、破坏 PWA 沉浸感）。
- `console.*` 不是用户反馈通道；仅保留诊断价值时的少量日志。
- 加载中状态不是 toast；放进全局队列会与面板生命周期打架（卸载后消息仍飘着，或重复刷屏）。

## 目标架构

### 1. Toast 子系统（唯一新建的「统一」部分）

职责：全局、短暂、非模态的应用内通知。

建议落点（名称可微调，职责不可糊）：

- `ToastProvider` + 根级 `ToastViewport`：队列、去重、超时、上限
- `ToastItem`：终端风样式；支持 `info | success | warning | error`；可选 action
- `useToast()`：业务侧唯一入口（例如 `toast.show({ messageKey, tone, action?, durationMs? })`）
- 默认时长等常量进入 `toastConfig`（可自 `TOAST_DURATION_MS` 迁入）；**不要**再发明平行的 MessageSystem / StatusIndicator 巨型目录，除非后续通道再次分叉到值得拆包

无障碍硬约束：

- Viewport / Item：`role="status"`（或错误用 `role="alert"`）+ 合适的 `aria-live`
- 不抢焦点；有关闭按钮时提供可访问名称
- 与主题 CSS 变量一致，禁止第二套「通用后台 toast」皮肤

### 2. 内联状态（不进 Toast）

- MusicPlayer：`dataLoading` / `dataError`（含歌单无效 vs 服务故障）继续渲染在播放器区域。
- 若要去掉对 `MessageDisplay` 的依赖：抽 `InlineStatus`（或同等）只服务「面板占位文案 + 可选操作」，**禁止**调用 `useToast`。
- PlayerInterface 顶栏 `CONNECTING` 属于控件状态文案，与 Toast 无关；最多视觉对齐，不做队列。

### 3. PWAPrompt

- 保留注册、轮询、`controllerchange`、可见性检查等 SW 所有权。
- 展示层：复用 `ToastItem` 视觉，或让 PWAPrompt 调用 `toast.show` 一次；**不得**把 SW 状态机搬进 ToastProvider。

### 4. OS Notification 与持久化失败

- Pomodoro 完成通知：继续 `Notification` API。
- `requestPermission` 被拒 → Toast（替换 `alert`）。
- `requestPermission` 抛错 → Toast（替换仅 `console.error` 对用户不可见的缺口）。
- 设置读写失败：默认仍日志即可；仅当失败会导致用户误以为已保存时，再发 **warning** Toast。不为「看起来完整」预加 `SETTINGS_APPLIED` 一类成功噪音。

## 明确不做

- 不做「一个 MessageSystem 吃掉 loading / error / PWA / OS / Boundary」的大一统框架。
- 不引入第三方 toast 库（体积与终端视觉都不可控）；自研薄层即可。
- 不为假设中的产品流程预埋未使用的 i18n 键。

## 落地清单

### A. Toast 基础设施

- [ ] Provider + Viewport 挂到应用根（保证 Settings / Audio / PWA 都能调用）
- [ ] `useToast` + 类型 / 默认时长配置
- [ ] 队列策略：同 key 去重或替换；同时可见条数上限；超时自动移除

### B. 必须迁入 Toast 的调用点

- [ ] `SettingsPanel`：`alert(NOTIFICATION_PERMISSION_DENIED)` → toast
- [ ] `SettingsPanel`：`Notification.requestPermission()` 失败 → 用户可见 toast（可保留少量 console）
- [ ] `AudioPlayer`：网络恢复提示（现 `showOnlineToast` + `MessageDisplay` + action）→ toast；时长走统一配置

### C. 内联通道（迁出 MessageDisplay，不进 Toast）

- [ ] `MusicPlayer` loading / error UI：改为内联状态组件或本地 JSX，删除对 `MessageDisplay` 的依赖
- [ ] （可选）PlayerInterface 顶栏文案与内联状态视觉对齐——非阻塞

### D. PWA

- [ ] `PWAPrompt`：展示复用 Toast 视觉或 API；SW 逻辑不动

### E. 清理

- [ ] 删除无引用的 `MessageDisplay.tsx`
- [ ] 移除已迁移的 `TOAST_DURATION_MS`（若已迁入 toast 配置）
- [ ] 全库搜索确认无 `alert(` / `confirm(` / `prompt(` / `MessageDisplay`

### F. 验证

- [ ] 通知权限拒绝：非阻塞 toast，主题一致，读屏可感知
- [ ] 离线→在线：网络恢复 toast + 切回在线源的 action 仍可用
- [ ] 在线歌单 loading / 无效歌单 / 服务故障：仍在播放器区域内，不出现全局飘条抢注意力
- [ ] PWA 更新提示：行为与现网一致
- [ ] `pnpm lint && pnpm check && pnpm test && pnpm build`

## 与旧草案的关系

旧版「MessageContainer / MessageProvider / MessageItem / StatusIndicator / useMessage / messageConfig 六件套 + 强行收编 MusicPlayer/PWA/可选 App 提示」**作废**。  
正确收敛点是：**统一全局 Toast 通道；其余通道按所有权分立。**
