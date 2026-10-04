/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        // @vitejs/plugin-react 6 移除了 babel 选项，
        // React Compiler 改经 @rolldown/plugin-babel 接入
        babel({ presets: [reactCompilerPreset()] }),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: [
                "favicon-32x32.png",
                "apple-touch-icon-180x180.png",
            ],
            manifest: {
                name: "Endfield Pomodoro",
                short_name: "Endfield",
                description: "融合 Cyber UI 和《终末地》风格的沉浸式番茄钟应用",
                theme_color: "#fff7d0",
                background_color: "#e5e5e5",
                display: "standalone",
                orientation: "any",
                start_url: "/",
                scope: "/",
                icons: [
                    {
                        src: "pwa-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any",
                    },
                    {
                        src: "pwa-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable",
                    },
                ],
                categories: ["productivity", "utilities"],
                lang: "zh-CN",
            },
            workbox: {
                cleanupOutdatedCaches: true,
                // 预缓存是 cache-first，index.html 放进去会让在线用户一直看到旧版
                globPatterns: ["**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
                // 浏览器只取 woff2，svg/woff 是死重（仅 remixicon 就 3.2MB）
                globIgnores: [
                    "**/remixicon-*.svg",
                    "**/remixicon-*.woff",
                    // 自托管字体：1800+ 个 unicode-range 分片文件（每片都有 .woff 和
                    // .woff2 两份），浏览器按需取用；全量预缓存等于往 Cache Storage
                    // 写几十 MB，且离线场景下也没有必要缓存全部生僻字分片
                    "**/noto-sans-*.woff",
                    "**/noto-sans-*.woff2",
                    "**/jetbrains-mono-*.woff",
                    "**/jetbrains-mono-*.woff2",
                    "**/rajdhani-*.woff",
                    "**/rajdhani-*.woff2",
                    // CJK 字族 CSS chunk（文件名是 400-<hash>.css / 700-<hash>.css，
                    // 由 Vite 依据被 import 的 400.css/700.css 命名）：每个用户只用得
                    // 上当前语言那两份，预缓存全部等于白装 850KB
                    "**/400-*.css",
                    "**/700-*.css",
                ],
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
                // 必须写 null：vite-plugin-pwa 默认是 "index.html"，会生成预缓存导航路由
                navigateFallback: null,
                ignoreURLParametersMatching: [/.*/],
                dontCacheBustURLsMatching: /\.(js|css)$/,
                runtimeCaching: [
                    // no-store 绕开 HTTP 缓存：否则 NetworkFirst 也可能拿到旧 HTML
                    {
                        urlPattern: ({ request, url }) =>
                            request.mode === "navigate" &&
                            !url.pathname.startsWith("/api") &&
                            !/\.(mp3|m4a|flac)$/i.test(url.pathname),
                        handler: "NetworkFirst",
                        method: "GET",
                        options: {
                            cacheName: "document-pages",
                            networkTimeoutSeconds: 3,
                            fetchOptions: { cache: "no-store" },
                            expiration: {
                                maxEntries: 1,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 1周离线回退 (PWA Support)
                            },
                        },
                    },
                    // 所有音乐 API 都必须绕过缓存：歌单内容会变，且请求靠查询参数区分，
                    // 而 ignoreURLParametersMatching 会忽略查询参数做匹配
                    {
                        urlPattern:
                            /^https:\/\/(api\.injahow\.cn|meting\.furwolf\.com|meting\.api\.418121\.xyz|meting\.jinghuashang\.cn)\/.*/i,
                        handler: "NetworkOnly",
                    },
                ],
            },
        }),
    ],
    test: {
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        css: false,
    },
});
