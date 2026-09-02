/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
    // 资源使用相对路径以支持可以和其他网站共存或存放于二级目录
    base: "./",
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
                start_url: "./",
                scope: "./",
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
                globPatterns: [
                    "**/*.{js,css,html,ico,png,svg,webp,woff,woff2}",
                ],
                maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
                navigateFallback: "index.html",
                navigateFallbackDenylist: [/^\/api/, /\.(mp3|m4a|flac)$/i],
                ignoreURLParametersMatching: [/.*/],
                // index.html 优先从网络获取，缓存仅作为离线回退
                dontCacheBustURLsMatching: /\.(js|css)$/,
                runtimeCaching: [
                    // index.html: 优先从网络获取，确保用户总是获得最新版本
                    {
                        urlPattern: /^.*\/index\.html$/,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "index-html",
                            expiration: {
                                maxEntries: 1,
                                maxAgeSeconds: 60 * 60 * 24 * 7, // 1周离线回退 (PWA Support)
                            },
                        },
                    },
                    // 两个音乐 API 都必须绕过缓存：歌单内容会变，且请求靠查询参数区分，
                    // 而 ignoreURLParametersMatching 会忽略查询参数做匹配
                    {
                        urlPattern: /^https:\/\/api\.i-meto\.com\/meting\/.*/i,
                        handler: "NetworkOnly",
                    },
                    {
                        urlPattern: /^https:\/\/api\.injahow\.cn\/meting\/.*/i,
                        handler: "NetworkOnly",
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-stylesheets",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-webfonts",
                            expiration: {
                                maxEntries: 30,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
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
