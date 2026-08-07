# Endfield Protocol - Pomodoro Terminal

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ChuwuYo/Endfield-Pomodoro)
[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/ChuwuYo/Endfield-Pomodoro)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19.2.7-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-v6.0.3-3178c6.svg)
![Vite](https://img.shields.io/badge/vite-v8.0.16-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-v4.3.0-38bdf8.svg)
![Remixicon](https://img.shields.io/badge/remixicon-v4.9.1-3178c6.svg)

> **TERMINAL_Version // SYSTEM_ONLINE**
>
> 一个受 Cyber UI 和 终末地 风格启发的沉浸式 Web 番茄钟应用。

## 核心特性 (Core Features)

### 番茄钟 (Pomodoro)
- **沉浸计时**: 呼吸灯效环形进度条，提供精确视觉反馈
- **多模式**: 支持工作/短休/长休循环，可配置自动序列
- **数据持久化**: 设置长期保存，专注统计仅在当前标签页会话生效

### 音频控制终端 (Audio Terminal)
- **双模式播放**:
  - **本地模式**: 支持导入现代浏览器支持的所有音频类型，具备进度与播放列表管理
  - **在线模式**: 集成 MetingAPI，支持网易云音乐/QQ音乐等平台的歌单解析
- **终端交互**: 支持基本信息、播放控制、封面展示及后台播放等功能

### 任务与配置 (Mission & Config)
- **任务协议**: 存储限制（Max 6），聚焦当前目标
- **完全自定义**: 计时参数、音效开关、音量及背景音乐源均可配置

### PWA支持

- **离线支持**: 通过 Service Worker 实现离线缓存
- **在线音乐**: 实现API过滤，在PWA环境下也能播放在线音乐

## 技术栈 (Tech Stack)

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **核心框架** | [React 19](https://react.dev/) | 现代声明式 UI 库，利用最新并发特性 |
| **性能优化** | [React Compiler](https://react.dev/learn/react-compiler) | 自动记忆化，优化运行时性能 |
| **构建工具** | [Vite](https://vitejs.dev/) | 下一代前端构建工具，极速冷启动 |
| **开发语言** | [TypeScript](https://www.typescriptlang.org/) | 静态强类型，提升代码可维护性 |
| **样式方案** | [TailwindCSS v4](https://tailwindcss.com/) | 原子化 CSS 引擎，支持 CSS 变量动态主题 |
| **图标库** | [Remixicon](https://remixicon.com/) | 风格统一的现代化图标集 |
| **状态管理** | React Hooks | 基于 Hook 的原生状态逻辑复用 |
| **代码质量** | [ESLint](https://eslint.org/) + [Biome](https://biomejs.dev/) | 代码检查与高性能格式化 |

## 快速开始 (Getting Started)

### 环境要求
- Node.js >= 22.22.2
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

## 国际化支持 (i18n)

项目支持中英双语，所有UI文本均通过 `i18n.ts` 管理，包括：

- 界面标签和按钮文本
- 状态提示信息
- 音乐平台和类型选项
- 错误和加载提示

## 主题系统 (Theme System)

使用 CSS Variables 实现动态主题切换，每个主题定义包括：

- 主色调 (--color-primary)
- 高亮色 (--color-highlight)
- 背景色 (--color-base, --color-surface)
- 文本色 (--color-text, --color-dim)
- 状态色 (--color-success, --color-error)
- 特效色 (--color-secondary, --color-accent)

所有主题配置存储在 `src/config/themes.ts` 中，主题效果组件分离在 `src/components/themes/` 目录下。

## 开发建议 (Development Tips)

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

## 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request ，请确保遵循现有的代码风格。

## 许可证 (License)

[MIT](LICENSE) © 2025 ChuwuYo

## 鸣谢 (Acknowledgments)

- [Gemini](https://gemini.google.com/) - 用于初期界面代码生成和优化、文档撰写
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [MetingJS](https://github.com/metowolf/MetingJS)
- [music-metadata](https://github.com/Borewit/music-metadata)
