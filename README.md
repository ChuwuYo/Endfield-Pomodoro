# Endfield Pomodoro

<div align="right">
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</div>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ChuwuYo/Endfield-Pomodoro)
[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/ChuwuYo/Endfield-Pomodoro)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-v6-3178c6.svg)
![Vite](https://img.shields.io/badge/vite-v8-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-v4-38bdf8.svg)
![Remixicon](https://img.shields.io/badge/remixicon-v4-3178c6.svg)

> **TERMINAL_Version // SYSTEM_ONLINE**
>
> An immersive Pomodoro timer web app inspired by Cyber UI and Endfield aesthetics.

Looking for Chinese? Read the [简体中文版](./README.zh-CN.md).

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Internationalization](#internationalization-i18n)
- [Theme System](#theme-system)
- [Development](#development)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

### Pomodoro Timer

- **Immersive timing**: breathing-glow circular progress ring with precise visual feedback
- **Multiple modes**: Work / Short Break / Long Break cycle with configurable auto-sequence
- **Persistence**: settings are stored long-term; focus stats live only for the current tab session

### Audio Control Terminal

- **Dual playback modes**:
  - **Local mode**: import any audio type supported by modern browsers, with progress and playlist management
  - **Online mode**: MetingAPI integration for playlists from NetEase, QQ Music, and other platforms
- **Terminal interaction**: metadata display, playback controls, cover art, and background playback

### Missions & Config

- **Mission protocol**: capped storage (max 6 tasks) to keep you focused on the current goal
- **Fully customizable**: timer lengths, sound toggles, volume, and background music source

### PWA Support

- **Offline support**: Service Worker based offline caching
- **Online music in PWA**: filtered API path so online music keeps working in the installed app

## Tech Stack

| Area | Choice | Notes |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | Modern declarative UI with the latest concurrent features |
| **Optimization** | [React Compiler](https://react.dev/learn/react-compiler) | Automatic memoization for better runtime performance |
| **Build** | [Vite](https://vitejs.dev/) | Next-generation tooling with instant cold start |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Static typing for maintainability |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) | Atomic CSS engine with CSS-variable-driven themes |
| **Icons** | [Remixicon](https://remixicon.com/) | Consistent modern icon set |
| **State** | React Hooks | Native Hook-based reusable state logic |
| **Quality** | [ESLint](https://eslint.org/) + [Biome](https://biomejs.dev/) | Linting and high-performance formatting |

## Getting Started

### Prerequisites

- Node.js >= 22.22.2
- pnpm (recommended), or npm / yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ChuwuYo/Endfield-Pomodoro.git
   cd endfield-pomodoro
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start the dev server**

   ```bash
   pnpm dev
   ```

   Open the local URL printed in the terminal (usually <http://localhost:5173>).

4. **Build for production**

   ```bash
   pnpm build
   ```

5. **Preview the production build**

   ```bash
   pnpm preview
   ```

## Internationalization (i18n)

The app supports English and Simplified Chinese. All UI strings are managed in `src/utils/i18n.ts`, including:

- Labels and button text
- Status messages
- Music platform / type options
- Error and loading hints

To add a new language, extend the `translations` map in `src/utils/i18n.ts` and update both language entries when UI text changes.

## Theme System

Themes are switched at runtime with CSS variables. Each theme defines:

- Primary (`--color-primary`)
- Highlight (`--color-highlight`)
- Background (`--color-base`, `--color-surface`)
- Text (`--color-text`, `--color-dim`)
- Status (`--color-success`, `--color-error`)
- Effects (`--color-secondary`, `--color-accent`)

Theme tokens live in `src/config/themes.ts`; themed background / foreground effects live under `src/components/themes/`.

## Development

### Add a new theme

Add a preset in `src/config/themes.ts`:

```typescript
[ThemePreset.YOUR_THEME]: {
  '--color-base': '#...',
  '--color-surface': '#...',
  '--color-highlight': '#...',
  '--color-primary': '#...',
  '--color-secondary': '#...',
  '--color-accent': '#...',
  '--color-text': '#...',
  '--color-dim': '#...',
  '--color-success': '#...',
  '--color-error': '#...'
}
```

For visual effects, add the corresponding components in `src/components/themes/BackgroundEffects.tsx` and `src/components/themes/ForegroundEffects.tsx`.

### Add a new language

```typescript
export const translations = {
  // ... existing languages
  [Language.NEW_LANG]: { /* translated strings */ }
}
```

### Change the default music config

Edit `src/config/musicConfig.ts`:

```typescript
// Default playlist
export const defaultMusicConfig: MusicConfig = {
  server: 'netease',  // 'netease' | 'tencent' | 'kugou' | 'baidu' | 'kuwo'
  type: 'playlist',   // currently only 'playlist' is supported
  id: '9094583817'    // playlist ID
};

// Default player volume (0.0 - 1.0)
export const DEFAULT_MUSIC_VOLUME = 0.5;
```

## Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Biome |
| `pnpm check` | Run Biome checks |
| `pnpm test` | Run tests with Vitest |

## Contributing

Issues and pull requests are welcome. Please follow the existing code style (see `AGENTS.md`: `pnpm lint` and `pnpm check` should pass).

## License

[MIT](LICENSE) © 2025 ChuwuYo

## Acknowledgments

- [Gemini](https://gemini.google.com/) - initial UI code generation, polish, and docs
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [pnpm](https://pnpm.io/)
- [Vite](https://vite.dev/)
- [React](https://react.dev/)
- [MetingJS](https://github.com/metowolf/MetingJS)
- [music-metadata](https://github.com/Borewit/music-metadata)
