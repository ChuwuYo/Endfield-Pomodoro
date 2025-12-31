# Endfield Protocol - Pomodoro Terminal

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ChuwuYo/Endfield-Pomodoro)
[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/ChuwuYo/Endfield-Pomodoro)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5.9.3-3178c6.svg)
![Vite](https://img.shields.io/badge/vite-v7.2.4-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-v4.1.17-38bdf8.svg)
![Remixicon](https://img.shields.io/badge/remixicon-v4.7.0-3178c6.svg)

> **TERMINAL_Version // SYSTEM_ONLINE**
>
> 一个受 Cyber UI 和 终末地 风格启发的沉浸式 Web 番茄钟应用。

## ✨ 核心特性 (Core Features)

### 🍅 番茄钟 (Pomodoro)
- **沉浸计时**: 呼吸灯效环形进度条，提供精确视觉反馈
- **多模式**: 支持工作/短休/长休循环，可配置自动序列
- **数据持久化**: 自动记录每日完成数与累计专注时长

### 🎵 音频控制终端 (Audio Terminal)
- **双模式播放**:
  - **本地模式**: 支持导入现代浏览器支持的所有音频类型，具备进度与播放列表管理
  - **在线模式**: 集成 MetingAPI，支持网易云/QQ音乐/酷狗等平台的歌单解析
- **终端交互**: 支持基本信息、播放控制、封面展示及后台播放等功能

### 📋 任务与配置 (Mission & Config)
- **任务协议**: 存储限制（Max 6），聚焦当前目标
- **完全自定义**: 计时参数、音效开关、音量及背景音乐源均可配置

### 📱 PWA支持

- **离线支持**: 通过 Service Worker 实现离线缓存
- **在线音乐**: 实现API过滤，在PWA环境下也能播放在线音乐

## 🛠️ 技术栈 (Tech Stack)

- **核心框架**: [React 19](https://react.dev/) - 利用最新的 Hooks 和并发特性
- **性能优化**: [React Compiler](https://react.dev/learn/react-compiler) - 自动记忆化优化，无需手动 useMemo/useCallback
- **构建工具**: [Vite](https://vitejs.dev/) - 极速的冷启动与热更新体验
- **开发语言**: [TypeScript](https://www.typescriptlang.org/) - 强类型保障代码健壮性
- **样式方案**: [TailwindCSS v4](https://tailwindcss.com/) - 原子化 CSS 引擎，配合 CSS Variables 实现动态主题切换
- **图标库**: [Remixicon](https://remixicon.com/) + [Lucide React](https://lucide.dev/) - 风格统一的开源图标集
- **状态管理**: React Hooks (useState, useEffect, useRef)
- **工具函数**: [react-use](https://github.com/streamich/react-use) - 实用的 React Hooks 集合

## 🚀 快速开始 (Getting Started)

### 环境要求
- Node.js >= 18
- pnpm (推荐) 或 npm/yarn

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/ChuwuYo/Endfield-Pomodoro.git
   cd endfield-pomodoro
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   访问终端显示的本地地址（通常为 http://localhost:5173）。

4. **构建生产版本**
   ```bash
   pnpm build
   ```

5. **预览生产版本**
   ```bash
   pnpm preview
   ```

## 📂 项目结构 (Project Structure)

```text
endfield-pomodoro/
├── docs/                       # 文档目录
├── public/                     # 公共静态资源目录
├── src/                        # 源代码目录
│   ├── assets/                 # 静态资源文件
│   │   └── images/             # 图片资源
│   ├── components/             # UI 组件库
│   │   ├── themes/             # 主题效果组件
│   │   │   ├── BackgroundEffects.tsx  # 各主题背景效果
│   │   │   ├── ForegroundEffects.tsx  # 各主题前景效果
│   │   │   └── index.ts               # 主题组件导出
│   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── Button.tsx      # 按钮组件
│   │   │   ├── Input.tsx       # 输入框和选择框组件
│   │   │   ├── Panel.tsx       # 面板组件
│   │   │   └── index.ts        # UI 组件导出
│   │   ├── AudioPlayer.tsx     # 本地音频播放器组件
│   │   ├── Checkbox.tsx        # 复选框组件
│   │   ├── CustomSelect.tsx    # 自定义下拉选择组件
│   │   ├── MessageDisplay.tsx  # 消息显示组件
│   │   ├── MikuDecorations.tsx # Miku 主题专属装饰组件
│   │   ├── MusicPlayer.tsx     # 在线音乐播放器组件
│   │   ├── PlayerInterface.tsx # 播放器UI界面组件
│   │   ├── Pomodoro.tsx        # 番茄钟核心组件
│   │   ├── PWAPrompt.tsx       # PWA 提示组件
│   │   ├── SoundManager.tsx    # 音效管理器 (Web Audio API)
│   │   ├── TaskManager.tsx     # 任务管理组件
│   │   └── TerminalUI.tsx      # 主题层容器组件
│   ├── config/                 # 配置文件
│   │   ├── musicConfig.ts      # 音乐播放器默认配置
│   │   └── themes.ts           # 主题颜色配置
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useFooterHeight.ts  # Footer 高度监听 Hook
│   │   ├── useIsMobile.ts      # 移动设备检测 Hook
│   │   ├── useLocalPlayer.ts   # 本地播放器逻辑 Hook
│   │   ├── useMusicData.ts     # 音乐数据获取
│   │   └── useOnlinePlayer.ts  # 在线播放器逻辑 Hook
│   ├── utils/                  # 工具函数
│   │   ├── i18n.ts             # 国际化配置（中英双语）
│   │   └── musicApiAdapters.ts # 音乐 API 适配器
│   ├── App.tsx                 # 主应用组件与布局
│   ├── constants.ts            # 全局常量定义
│   ├── index.css               # 全局样式与 Tailwind 引入
│   ├── main.tsx                # 渲染入口
│   ├── types.ts                # TypeScript 核心类型定义
│   └── vite-env.d.ts           # Vite 环境类型定义
├── index.html                  # HTML 入口文件
```

## 🌐 国际化支持 (i18n)

项目完全支持中英双语，所有UI文本均通过 `i18n.ts` 管理，包括：

- 界面标签和按钮文本
- 状态提示信息
- 音乐平台和类型选项
- 错误和加载提示

切换语言后无需刷新页面，所有文本即时更新。

## 🎨 主题系统 (Theme System)

使用 CSS Variables 实现动态主题切换，每个主题定义包括：

- 主色调 (--color-primary)
- 高亮色 (--color-highlight)
- 背景色 (--color-base, --color-surface)
- 文本色 (--color-text, --color-dim)
- 状态色 (--color-success, --color-error)
- 特效色 (--color-secondary, --color-accent)

所有主题配置存储在 `src/config/themes.ts` 中，可轻松扩展新主题。主题效果组件分离在 `src/components/themes/` 目录下，实现了背景和前景效果的模块化管理。

## 🔧 开发建议 (Development Tips)

### 添加新主题
在 `src/config/themes.ts` 的 THEMES 中添加新的主题配置：

```typescript
[ThemePreset.YOUR_THEME]: {
  '--color-base': '#颜色值',
  '--color-surface': '#颜色值',
  '--color-highlight': '#颜色值',
  '--color-primary': '#颜色值',
  '--color-secondary': '#颜色值',
  '--color-accent': '#颜色值',
  '--color-text': '#颜色值',
  '--color-dim': '#颜色值',
  '--color-success': '#颜色值',
  '--color-error': '#颜色值'
}
```

如需添加主题特效，可在 `src/components/themes/BackgroundEffects.tsx` 和 `src/components/themes/ForegroundEffects.tsx` 中添加对应的效果组件。

### 添加新语言
在 `src/utils/i18n.ts` 中添加新的语言配置：

```typescript
export const translations = {
  // ... 现有语言
  [Language.NEW_LANG]: { /* 翻译内容 */ }
}
```

### 修改默认音乐配置
编辑 `src/config/musicConfig.ts` 中的配置：

```typescript
// 默认歌单配置
export const defaultMusicConfig: MusicConfig = {
  server: 'netease',  // 音乐平台：'netease' | 'tencent' | 'kugou' | 'baidu' | 'kuwo'
  type: 'playlist',   // 类型：目前仅支持 'playlist'
  id: '9094583817'    // 歌单 ID
};

// 音乐播放器默认音量（0.0 - 1.0）
export const DEFAULT_MUSIC_VOLUME = 0.5;
```

### 代码组织原则
- **组件分层**: UI 基础组件 (`src/components/ui/`)、主题效果组件 (`src/components/themes/`)、业务组件分离
- **配置集中**: 所有配置文件统一在 `src/config/` 目录下管理
- **常量文件**: 所有常量统一在 `constants.ts` 中管理
- **类型文件**: 所有 TypeScript 类型定义在 `types.ts` 中
- **工具函数**: 纯函数放在 `utils/` 目录下
- **自定义 Hooks**: 可复用的逻辑放在 `hooks/` 目录下

### React Compiler 说明

本项目启用了 React Compiler，会自动优化组件性能：
- 自动记忆化组件输出，无需使用 `React.memo`
- 自动缓存计算结果，无需使用 `useMemo`
- 自动优化回调函数，无需使用 `useCallback`
- 编译器配置位于 [vite.config.ts](./vite.config.ts) 中
- 使用 React DevTools 可查看哪些组件被编译器优化

**注意：** 虽然 React Compiler 提供了自动优化，但在以下场景中仍然保留了显式的 hooks 调用：
- 当需要确保对象/函数引用稳定性时（如传递给子组件的 props）
- 当涉及复杂的依赖关系时
- 为了提高代码可读性和显式意图

## 🤝 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request ，请确保遵循现有的代码风格。

## 📄 许可证 (License)

[MIT](LICENSE) © 2025 ChuwuYo

## 📝 鸣谢 (Acknowledgments)

- [Gemini](https://gemini.google.com/) - 用于初期界面代码生成和优化、文档撰写
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [MetingJS](https://github.com/metowolf/MetingJS)
- [music-metadata](https://github.com/Borewit/music-metadata)