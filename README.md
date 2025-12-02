# Endfield Protocol - Pomodoro Terminal

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19.2.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5.9.3-3178c6.svg)
![Vite](https://img.shields.io/badge/vite-v7.2.4-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-v4.1.17-38bdf8.svg)

> **TERMINAL_Version // SYSTEM_ONLINE**
>
> 一个融合 Cyber UI 和《终末地》风格的沉浸式 Web 番茄钟应用。

## ✨ 核心特性 (Core Features)

### 🍅 番茄钟 (Pomodoro)
- **沉浸计时**: 呼吸灯效环形进度条，提供精确视觉反馈
- **多模式**: 支持工作/短休/长休循环，可配置自动序列
- **数据持久化**: 自动记录每日完成数与累计专注时长

### 🎵 音频控制终端 (Audio Terminal)
- **双模式播放**:
  - **本地模式**: 支持导入现代浏览器支持的所有音频类型，具备进度与播放列表管理
  - **在线模式**: 集成 MetingJS，支持网易云/QQ音乐/酷狗等平台的歌单解析
- **终端交互**: 极简终端风格界面，支持封面展示及后台播放

### 📋 任务与配置 (Mission & Config)
- **任务协议**: 存储限制（Max 6），聚焦当前目标
- **系统个性化**:
  - **8种主题**: 从工业黑橙到赛博霓虹，每种主题包含独特的动态背景粒子
  - **国际化**: 中/英双语切换
  - **完全自定义**: 计时参数、音效开关、音量及背景音乐源均可配置

## 🛠️ 技术栈 (Tech Stack)

本项目采用最新的前端技术栈构建，确保高性能与开发体验：

- **核心框架**: [React 19](https://react.dev/) - 利用最新的 Hooks 和并发特性
- **性能优化**: [React Compiler](https://react.dev/learn/react-compiler) - 自动记忆化优化，无需手动 useMemo/useCallback
- **构建工具**: [Vite](https://vitejs.dev/) - 极速的冷启动与热更新体验
- **开发语言**: [TypeScript](https://www.typescriptlang.org/) - 强类型保障代码健壮性
- **样式方案**: [TailwindCSS v4](https://tailwindcss.com/) - 原子化 CSS 引擎，配合 CSS Variables 实现动态主题切换
- **图标库**: [Remixicon](https://remixicon.com/) + [Lucide React](https://lucide.dev/) - 风格统一的开源图标集
- **音频处理**: Web Audio API - 原生实现振荡器音效，无额外音频资源依赖
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
├── src/                        # 源代码目录
│   ├── assets/                 # 静态资源文件
│   ├── components/             # UI 组件库
│   │   ├── AudioPlayer.tsx     # 本地音频播放器组件
│   │   ├── MusicPlayer.tsx     # 在线音乐播放器组件
│   │   ├── PlayerInterface.tsx # 播放器UI界面组件
│   │   ├── Checkbox.tsx        # 复选框组件
│   │   ├── CustomSelect.tsx    # 自定义下拉选择组件
│   │   ├── Pomodoro.tsx        # 番茄钟核心组件
│   │   ├── SoundManager.tsx    # 音效管理器 (Web Audio API)
│   │   ├── TaskManager.tsx     # 任务管理组件
│   │   └── TerminalUI.tsx      # 基础终端风格组件 (Panel, Button, Input)
│   ├── config/                 # 配置文件
│   │   └── musicConfig.ts      # 音乐播放器默认配置
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useMetingData.ts    # MetingJS API 数据获取 Hook
│   │   └── useOnlinePlayer.ts  # 在线播放器逻辑 Hook
│   ├── utils/                  # 工具函数
│   │   └── i18n.ts             # 国际化配置（中英双语）
│   ├── constants.ts            # 全局常量定义（存储键、API配置等）
│   ├── types.ts                # TypeScript 核心类型定义
│   ├── App.tsx                 # 主应用组件与布局
│   ├── main.tsx                # 渲染入口
│   └── index.css               # 全局样式与 Tailwind 引入
├── index.html                  # HTML 入口文件
├── package.json                # 项目依赖配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.app.json           # TypeScript 应用配置
├── tsconfig.node.json          # TypeScript Node 配置
├── vite.config.ts              # Vite 构建配置
├── eslint.config.js            # ESLint 配置
└── README.md                   # 项目文档
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

- 主色调 (--theme-primary)
- 高亮色 (--theme-highlight)
- 背景色 (--theme-bg, --theme-surface)
- 文本色 (--theme-text, --theme-dim)
- 特效色 (--glow-color, --particle-color)

所有主题配置存储在 `App.tsx` 中，可轻松扩展新主题。

## 🔧 开发建议 (Development Tips)

### 添加新主题
在 `App.tsx` 的 THEMES 中添加新的主题配置：

```typescript
[ThemePreset.YOUR_THEME]: {
  '--color-base': '#颜色值',
  '--color-surface': '#颜色值',
  '--color-primary': '#颜色值',
  // ... 其他 CSS 变量
}
```

### 添加新语言
在 `src/utils/i18n.ts` 中添加新的语言配置：

```typescript
export const translations = {
  // ... 现有语言
  [Language.NEW_LANG]: { /* 翻译内容 */ }
}
```

### 修改默认音乐配置
编辑 `src/config/musicConfig.ts` 中的 `defaultMetingConfig`。

### 修改全局常量
编辑 `src/constants.ts` 统一管理所有常量：
- **STORAGE_KEYS**: LocalStorage 存储键
- **METING_API_BASE_URL**: 在线音乐 API 地址
- **NEXT_TRACK_RETRY_DELAY_MS**: 音频重试延迟时间

### 代码组织原则
- **组件文件**: 只导出 React 组件，支持 Fast Refresh
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
- 由于编译器仍处于实验阶段，我保留了一些 `useMemo` 和 `useCallback` 调用，以确保兼容性

## 🤝 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request 来改进这个终端系统。请确保遵循现有的代码风格（TypeScript + TailwindCSS）。

## 📄 许可证 (License)

[MIT](LICENSE) © 2025 ChuwuYo

## 📝 鸣谢 (Acknowledgments)

- [Gemini](https://gemini.google.com/) - 用于部分代码生成和优化、文档撰写
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [MetingJS](https://github.com/metowolf/MetingJS)
- [music-metadata](https://github.com/Borewit/music-metadata)