# Endfield Pomodoro

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-v19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-v6-3178c6.svg)
![Vite](https://img.shields.io/badge/vite-v8-646cff.svg)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-v4-38bdf8.svg)
![Remixicon](https://img.shields.io/badge/remixicon-v4-3178c6.svg)

> **TERMINAL_Version // SYSTEM_ONLINE**
>
> An immersive Pomodoro timer web app inspired by Cyber UI and Endfield aesthetics.

[English](./README.md) | [简体中文](./README.zh-CN.md)

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
- **Terminal interaction**: metadata display, playback controls, cover art, background playback, and system media controls

### Missions & Config

- **Mission protocol**: capped storage (max 6 tasks) to keep you focused on the current goal
- **Fully customizable**: timer lengths, sound toggles, volume, and background music source

### PWA Support

- **Offline support**: Service Worker based offline caching
- **Online music in PWA**: filtered API path so online music keeps working in the installed app
- **Prompted updates**: new versions apply automatically when idle and only show a prompt while you are busy

## Tech Stack

| Area | Choice | Notes |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) | Modern declarative UI with the latest concurrent features |
| **Optimization** | [React Compiler](https://react.dev/learn/react-compiler) | Automatic memoization for better runtime performance |
| **Build** | [Vite](https://vitejs.dev/) | Next-generation tooling with instant cold start |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Static typing for maintainability |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) | Atomic CSS engine with CSS-variable-driven themes |
| **Icons** | [Remixicon](https://remixicon.com/) | Consistent modern icon set |
| **Fonts** | [Fontsource](https://fontsource.org/) | Self-hosted JetBrains Mono / Rajdhani / Noto CJK, unicode-range subsetting |
| **State** | React Hooks | Native Hook-based reusable state logic |
| **PWA** | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | Workbox-based offline caching and prompted updates |
| **Testing** | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) | Unit and component tests in jsdom |
| **Quality** | [ESLint](https://eslint.org/) + [Biome](https://biomejs.dev/) | Linting and high-performance formatting |

## Getting Started

### Prerequisites

- Node.js >= 22.22.2 (CI uses Node.js 24 LTS)
- pnpm (recommended), or npm / yarn

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/ChuwuYo/Endfield-Pomodoro.git
   cd Endfield-Pomodoro
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

The app supports English, Simplified Chinese, Traditional Chinese, Japanese, and Korean. All UI strings are managed in `src/utils/i18n.ts`, including:

- Labels and button text
- Status messages
- Music platform / type options
- Error and loading hints

When UI text changes, update every locale entry in `src/utils/i18n.ts`.

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

For visual effects, create `src/components/themes/<preset>/` with an `index.ts`, the background / foreground components, and a `<preset>.css` scoped under `html[data-theme="<PRESET>"]`, then export them from `src/components/themes/index.ts`.

### Add a new language

```typescript
export const translations = {
  // ... existing languages
  [Language.NEW_LANG]: { /* translated strings */ }
}
```

Also add the language to `Language` in `src/types.ts` and its font family to `src/utils/cjkFont.ts`.

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
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm bench` | Perf ratchet: launch + timer-tick measurements against `bench/baseline.json` (run `pnpm build` first, local only) |
| `pnpm bench:save` | Lower the ratchet to the current measurements |

## Contributing

Issues and pull requests are welcome. Please follow the existing code style (see `AGENTS.md`: `pnpm lint` and `pnpm check` should pass).

## License

[MIT](LICENSE) © 2025 ChuwuYo

## Acknowledgments

- [MetingJS](https://github.com/metowolf/MetingJS)
- Online Meting API sources: `api.injahow.cn`, `meting.furwolf.com`, `meting.api.418121.xyz`, and `meting.jinghuashang.cn`
