# 通知与状态通道（架构说明 + 落地清单）

> 对应 `docs/OPTIMIZATION_TODO.md` 专项 **#11**。  
> 本文是现行架构结论，取代早期「一锅炖 MessageSystem」草案。

## 第一性原理

用户看到的「提示」不是同一种东西。把语义不同的通道捏成一个大框架，会破坏归属边界、a11y 语义和生命周期。

按**谁拥有反馈、用户期望在哪里看到它、生命周期由谁结束**划分通道：

| 通道 | 语义 | 现状 | 决策 |
| --- | --- | --- | --- |
| **全局短暂通知（Toast）** | 与当前面板无强绑定；出现后自动消失或可关闭 | 原 `alert()`（通知权限被拒）；AudioPlayer 网络恢复 | **统一**：`ToastProvider` + `useToast` |
| **上下文状态（Inline status）** | 占据业务区域，描述「这一块现在怎样」 | MusicPlayer 全屏 `CONNECTING` / 错误块；PlayerInterface 顶栏 loading 文案 | **保持内联**；不进全局队列 |
| **系统通知（OS Notification）** | 标签页外、系统级打断 | Pomodoro `new Notification(...)` | **保持** Web Notification；失败可降级为一次 Toast，不反向吞并 OS 通道 |
| **PWA 更新提示** | 绑定 Service Worker / autoUpdate 生命周期 | `PWAPrompt` 经 `onNeedReload` 决定何时提示 | **逻辑留在 PWAPrompt**；展示走持久 toast + 刷新 action（接管插件默认 `location.reload`） |
| **崩溃恢复** | 渲染树已不可用 | `ErrorBoundary` | **保持独立**；不属于消息队列 |

错误原则：

- 原生 `alert` / `confirm` / `prompt` 在生产 UI 中不可接受（阻塞主线程、不可主题化、破坏 PWA 沉浸感）。
- `console.*` 不是用户反馈通道；仅保留诊断价值时的少量日志。
- 加载中状态不是 toast；放进全局队列会与面板生命周期打架（卸载后消息仍飘着，或重复刷屏）。

## 目标架构

### 1. Toast 子系统（唯一新建的「统一」部分）

职责：全局、短暂、非模态的应用内通知。

落点：

- `src/components/toast/`：`ToastProvider` + Viewport、`ToastItem`、`useToast`
- `src/config/toastConfig.ts`：默认时长与同时可见上限
- 业务侧唯一入口：`toast.show({ id?, messageKey, tone?, action?, durationMs?, onDismiss? })`
- 队列：同 `id` 替换；超过 `TOAST_MAX_VISIBLE` 丢弃最旧并触发其 `onDismiss`

无障碍硬约束：

- Viewport / Item：`info|success` → `role="status"` + `aria-live="polite"`；`warning|error` → `role="alert"` + `aria-live="assertive"`；`aria-atomic="true"`
- 不抢焦点；关闭按钮提供可访问名称（`CLOSE`）
- 与主题 CSS 变量一致

### 2. 内联状态（不进 Toast）

- MusicPlayer：`dataLoading` / `dataError`（含歌单无效 vs 服务故障）继续渲染在播放器区域。
- PlayerInterface 顶栏 `CONNECTING` 属于控件状态文案，与 Toast 无关。

### 3. PWAPrompt

- 保留注册、小时/`visibility` 轮询等 SW 所有权（web.dev：长驻页应主动 `registration.update()`）。
- `registerType: "autoUpdate"` 下用官方 `onNeedReload` 接管默认整页刷新；展示：`toast.show` + 刷新 action。**不要**再自写 `controllerchange` 与插件抢控制权。
- 展示：`toast.show({ id: "pwa-updated", durationMs: null, action: reload, ... })`；**不得**把 SW 状态机搬进 ToastProvider。

### 4. OS Notification 与持久化失败

- Pomodoro 完成通知：继续 `Notification` API。
- `requestPermission` 被拒 / 抛错 → Toast（已替换 `alert`）。
- 设置读写失败：默认仍日志即可；仅当失败会导致用户误以为已保存时，再发 **warning** Toast。不为「看起来完整」预加成功噪音。

## 明确不做

- 不做「一个 MessageSystem 吃掉 loading / error / PWA / OS / Boundary」的大一统框架。
- 不引入第三方 toast 库（体积与终端视觉都不可控）；自研薄层即可。
- 不为假设中的产品流程预埋未使用的 i18n 键。

## 落地清单

### A. Toast 基础设施

- [x] Provider + Viewport 挂到应用根（保证 Settings / Audio / PWA 都能调用）
- [x] `useToast` + 类型 / 默认时长配置
- [x] 队列策略：同 key 去重或替换；同时可见条数上限；超时自动移除

### B. 必须迁入 Toast 的调用点

- [x] `SettingsPanel`：`alert(NOTIFICATION_PERMISSION_DENIED)` → toast
- [x] `SettingsPanel`：`Notification.requestPermission()` 失败 → 用户可见 toast（可保留少量 console）
- [x] `AudioPlayer`：网络恢复提示 → toast；时长走 `toastConfig`

### C. 内联通道（迁出 MessageDisplay，不进 Toast）

- [x] `MusicPlayer` loading：本地 JSX 内联；error UI 本就内联
- [x] （可选）PlayerInterface 顶栏文案与内联状态视觉对齐——非阻塞，未做

### D. PWA

- [x] `PWAPrompt`：经 `onNeedReload` 展示 Toast + 刷新 action；SW 轮询逻辑不动
- [ ] PWA 更新提示：需生产构建 + 真实 SW 字节变更验收（开发态 `virtual:pwa-register/dev` 不会走 autoUpdate 重载路径）

### E. 清理

- [x] 删除无引用的 `MessageDisplay.tsx`
- [x] `TOAST_DURATION_MS` 迁入 `toastConfig`（`TOAST_DEFAULT_DURATION_MS`）
- [x] 全库搜索确认无 `alert(` / `confirm(` / `prompt(` / `MessageDisplay`（源码）

### F. 验证

- [x] `pnpm lint && pnpm check && pnpm test && pnpm build`
- [x] 通知权限拒绝：非阻塞 toast（`role=alert`），主题一致（浏览器冒烟）
- [x] 离线→在线：网络恢复 toast +「切换至在线」action 可见（浏览器冒烟）
- [x] 在线歌单 loading：不进 toast viewport（浏览器冒烟；错误态仍为面板内联 JSX）
- [ ] PWA 更新：代码已对齐官方 `onNeedReload`；实机需生产构建 + SW 字节变更（dev 注册模块不走 autoUpdate 重载）
