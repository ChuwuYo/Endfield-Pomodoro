# 通知与状态通道（架构说明 + 落地清单）

> 对应 `docs/OPTIMIZATION_TODO.md` 专项 **#11**。  
> 本文是现行架构结论，取代早期「一锅炖 MessageSystem」草案。  
> 命名对齐 Material：**Snackbar**（应用内短暂反馈），不是 Android 系统 `Toast`。

## 第一性原理

用户看到的「提示」不是同一种东西。把语义不同的通道捏成一个大框架，会破坏归属边界、a11y 语义和生命周期。

按**谁拥有反馈、用户期望在哪里看到它、生命周期由谁结束**划分通道：

| 通道 | 语义 | 现状 | 决策 |
| --- | --- | --- | --- |
| **全局短暂通知（Snackbar）** | 与当前面板无强绑定；出现后自动消失或可关闭 | 原 `alert()`（通知权限被拒）；AudioPlayer 网络恢复 | **统一**：`SnackbarProvider` + `useSnackbar` |
| **上下文状态（Inline status）** | 占据业务区域，描述「这一块现在怎样」 | MusicPlayer 全屏 `CONNECTING` / 错误块；PlayerInterface 顶栏 loading 文案 | **保持内联**；不进全局队列 |
| **系统通知（OS Notification）** | 标签页外、系统级打断 | Pomodoro `new Notification(...)` | **保持** Web Notification；失败可降级为一次 Snackbar，不反向吞并 OS 通道 |
| **PWA 更新提示** | 绑定 Service Worker / autoUpdate 生命周期 | `PWAPrompt` 经 `onNeedReload` 决定何时提示 | **逻辑留在 PWAPrompt**；展示走持久 snackbar + 刷新按钮（接管插件默认 `location.reload`） |
| **崩溃恢复** | 渲染树已不可用 | `ErrorBoundary` | **保持独立**；不属于消息队列 |

错误原则：

- 原生 `alert` / `confirm` / `prompt` 在生产 UI 中不可接受（阻塞主线程、不可主题化、破坏 PWA 沉浸感）。
- `console.*` 不是用户反馈通道；仅保留诊断价值时的少量日志。
- 加载中状态不是 snackbar；放进全局队列会与面板生命周期打架。

## 目标架构

### 1. Snackbar 子系统（唯一新建的「统一」部分）

职责：全局、短暂、非模态的应用内通知（Material Snackbar 语义）。

落点：

- `src/components/snackbar/`：`SnackbarProvider` + Viewport、`SnackbarItem`、`useSnackbar`
- `src/config/snackbarConfig.ts`：默认时长与同时可见上限
- 业务侧唯一入口：`snackbar.show({ id?, messageKey, tone?, action?, durationMs?, onDismiss? })`
- `action`：条上可选的一枚操作按钮（如「切换至在线」「刷新页面」），不是必须手动关闭
- 队列：同 `id` 替换；超过 `SNACKBAR_MAX_VISIBLE` 丢弃最旧并触发其 `onDismiss`

无障碍硬约束：

- Viewport / Item：`info|success` → `role="status"` + `aria-live="polite"`；`warning|error` → `role="alert"` + `aria-live="assertive"`；`aria-atomic="true"`
- 不抢焦点；关闭按钮提供可访问名称（`CLOSE`）
- 与主题 CSS 变量一致

### 2. 内联状态（不进 Snackbar）

- MusicPlayer：`dataLoading` / `dataError`（含歌单无效 vs 服务故障）继续渲染在播放器区域。
- PlayerInterface 顶栏 `CONNECTING` 属于控件状态文案，与 Snackbar 无关。

### 3. PWAPrompt

- 保留注册、小时/`visibility` 轮询等 SW 所有权（web.dev：长驻页应主动 `registration.update()`）。
- `registerType: "autoUpdate"` 下用官方 `onNeedReload` 接管默认整页刷新；展示：`snackbar.show` + 刷新按钮。**不要**再自写 `controllerchange` 与插件抢控制权。
- 展示：`snackbar.show({ id: "pwa-updated", durationMs: null, action: reload, ... })`；**不得**把 SW 状态机搬进 SnackbarProvider。

### 4. OS Notification 与持久化失败

- Pomodoro 完成通知：继续 `Notification` API。
- `requestPermission` 被拒 / 抛错 → Snackbar（已替换 `alert`）。
- 设置即时写入（时长/主题等）：页面本身已有视觉变化，不另发成功 Snackbar。
- **「应用配置」**（在线音乐草稿 → 正式配置）：设置页上看不出变化，点完后发一次 success Snackbar。
- 设置读写失败：默认仍日志即可；仅当失败会导致用户误以为已保存时，再发 **warning** Snackbar。

## 明确不做

- 不做「一个 MessageSystem 吃掉 loading / error / PWA / OS / Boundary」的大一统框架。
- 不引入第三方 toast/snackbar 库；自研薄层即可。
- 不为假设中的产品流程预埋未使用的 i18n 键。
- 不为带 action 的条强制「必须手动关闭」（本站 action 另有等价入口）。

## 落地清单

### A. Snackbar 基础设施

- [x] Provider + Viewport 挂到应用根（保证 Settings / Audio / PWA 都能调用）
- [x] `useSnackbar` + 类型 / 默认时长配置
- [x] 队列策略：同 key 去重或替换；同时可见条数上限；超时自动移除

### B. 必须迁入 Snackbar 的调用点

- [x] `SettingsPanel`：`alert(NOTIFICATION_PERMISSION_DENIED)` → snackbar
- [x] `SettingsPanel`：`Notification.requestPermission()` 失败 → 用户可见 snackbar
- [x] `SettingsPanel`：「应用配置」→ success snackbar
- [x] `AudioPlayer`：网络恢复提示 → snackbar；时长走 `snackbarConfig`

### C. 内联通道（迁出 MessageDisplay，不进 Snackbar）

- [x] `MusicPlayer` loading：本地 JSX 内联；error UI 本就内联
- [x] （可选）PlayerInterface 顶栏文案与内联状态视觉对齐——非阻塞，未做

### D. PWA

- [x] `PWAPrompt`：经 `onNeedReload` 展示 Snackbar + 刷新按钮；SW 轮询逻辑不动
- [ ] PWA 更新提示：需生产构建 + 真实 SW 字节变更验收（开发态 `virtual:pwa-register/dev` 不会走 autoUpdate 重载路径）

### E. 清理

- [x] 删除无引用的 `MessageDisplay.tsx`
- [x] 时长常量在 `snackbarConfig`（`SNACKBAR_DEFAULT_DURATION_MS`）
- [x] 全库搜索确认无 `alert(` / `confirm(` / `prompt(` / `MessageDisplay`（源码）

### F. 验证

- [x] `pnpm lint && pnpm check && pnpm test && pnpm build`
- [x] 通知权限拒绝：非阻塞 snackbar（`role=alert`），主题一致（浏览器冒烟）
- [x] 离线→在线：网络恢复 snackbar +「切换至在线」按钮可见（浏览器冒烟）
- [x] 在线歌单 loading：不进 snackbar viewport（浏览器冒烟；错误态仍为面板内联 JSX）
- [ ] PWA 更新：代码已对齐官方 `onNeedReload`；实机需生产构建 + SW 字节变更（dev 注册模块不走 autoUpdate 重载）
