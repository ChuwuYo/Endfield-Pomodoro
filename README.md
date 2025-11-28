# Endfield Pomodoro - 项目评估与 Next.js 迁移指南

## 1. 项目评估

### 当前架构
- **框架**: React 19 (SPA)
- **构建工具**: Vite 7.2
- **语言**: TypeScript
- **样式**: Tailwind CSS 4.1
- **图标**: Remix Icon
- **响应式**: 移动端优化（自适应高度、隐藏滚动条、底部留白）
- **状态管理**: React Hooks (`useState`, `useEffect`) + `react-use`
- **路由**: 无 (单页面，通过条件渲染切换视图)

### 迁移复杂度: **低**
迁移到 Next.js 被评估为 **简单**，原因如下：
1.  **无复杂路由**: 应用目前使用单页面方式，通过条件渲染切换视图（`Dashboard` vs `Settings`）。这可以很容易地映射到 Next.js 的单个 `page.tsx`。
2.  **客户端逻辑**: 核心逻辑（计时器、音频）是客户端的。Next.js 通过客户端组件（`"use client"`）完全支持这一点。
3.  **现代技术栈**: 已经使用了 React 19 和 TypeScript，这与最新的 Next.js 版本完美契合。
4.  **Tailwind CSS**: 已经配置好，只需要极少的调整。

---

## 2. 迁移指南 (原地迁移)

按照以下步骤将当前的 Vite 项目迁移到 Next.js。

### 第一步：安装依赖
移除 Vite 相关包并安装 Next.js。

```bash
# 卸载 Vite 依赖
npm uninstall vite @vitejs/plugin-react @tailwindcss/vite

# 安装 Next.js 和用于 Tailwind v4 的 PostCSS
# 注意：remixicon 已安装，无需重新安装
npm install next postcss @tailwindcss/postcss
```

### 第二步：更新配置

#### 1. 更新 `package.json` 脚本
替换 `scripts` 部分：

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

#### 2. 配置 PostCSS (Tailwind v4 必需)
在根目录下创建一个名为 `postcss.config.mjs` 的文件：

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

#### 3. 更新 `tsconfig.json`
当你第一次运行 `npm run dev` 时，Next.js 会自动配置 `tsconfig.json`。你可以删除 `tsconfig.node.json` 和 `tsconfig.app.json`，如果你想将它们合并到一个 `tsconfig.json` 中，或者如果你知道如何管理引用，也可以保留它们。为了简单起见，你可以依赖 Next.js 自动生成的配置。

### 第三步：重构为 App Router

1.  **创建 App 目录**: 创建一个新文件夹 `src/app`。
2.  **移动样式**: 将 `src/index.css` 移动到 `src/app/globals.css`。

### 第四步：创建 Next.js 入口文件

#### 1. 创建 `src/app/layout.tsx`
这替代了 `index.html` 和 `main.tsx`。
**重要**：必须在此处引入 `remixicon` 样式。

```tsx
import type { Metadata } from "next";
import "./globals.css";
import "remixicon/fonts/remixicon.css"; // 引入图标样式

export const metadata: Metadata = {
  title: "Endfield Pomodoro",
  description: "Endfield Protocol Terminal V3.0.4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### 2. 创建 `src/app/page.tsx`
这替代了 `src/App.tsx` 作为主要入口。由于 `App.tsx` 使用了 hooks，我们将它标记为客户端组件。

```tsx
"use client";

import App from "../App"; // 导入现有的 App 组件

export default function Home() {
  return <App />;
}
```
*注意：你可以最终将 `src/App.tsx` 的逻辑直接重构进 `page.tsx`，或者保留它作为包装器。*

### 第五步：组件与样式调整

1.  **更新 `src/App.tsx`**:
    - 确保 `App.tsx` 被视为标准组件。
    - 如果 `App.tsx` 在渲染时立即依赖 `window` or `document`，请确保这些检查在 `useEffect` 内部（看起来已经是这样了）。

2.  **更新 `tailwind.config.ts` (如果适用)**:
    - 如果你使用的是 Tailwind v4（它会自动检测文件），你可能不需要配置文件。如果你有一个，确保它包含 `app` 目录：
    ```ts
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    ```

### 第六步：清理
删除以下不再需要的文件：
- `index.html`
- `vite.config.ts`
- `src/main.tsx`
- `tsconfig.node.json`
- `tsconfig.app.json`

### 第七步：运行
启动开发服务器：
```bash
npm run dev
```

---

## 3. 未来改进 (迁移后)
- **服务端组件**: 将静态部分（如 Header 或 Footer，如果它们不需要状态）移动到服务端组件以获得更好的性能。
- **路由**: 将 `Settings` 视图重构为真正的路由 (`src/app/settings/page.tsx`)，而不是条件渲染。
- **元数据**: 使用 Next.js Metadata API 获得更好的 SEO。
