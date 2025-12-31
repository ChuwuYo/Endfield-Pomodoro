import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32x32.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Endfield Protocol - Pomodoro Terminal',
        short_name: 'Endfield',
        description: '融合 Cyber UI 和《终末地》风格的沉浸式番茄钟应用',
        theme_color: '#fff7d0',
        background_color: '#e5e5e5',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['productivity', 'utilities'],
        lang: 'zh-CN'
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api/,
          /\.(mp3|m4a|flac)$/i
        ],
        ignoreURLParametersMatching: [/.*/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.injahow\.cn\/meting\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ request }) => {
              return request.destination === 'audio' || request.destination === 'video';
            },
            handler: 'NetworkOnly'
          },
          {
            urlPattern: ({ url }) => {
              return (
                // 网易云音乐
                url.hostname.includes('music.126.net') ||
                url.hostname.includes('music.163.com') ||
                
                // 腾讯音乐/QQ音乐
                url.hostname.includes('y.qq.com') ||          // c.y.qq.com, u.y.qq.com
                url.hostname.includes('qqmusic') ||           // stream.qqmusic.qq.com
                url.hostname.includes('gtimg.cn') ||          // y.gtimg.cn (封面)
                
                // 酷狗音乐
                url.hostname.includes('kugou.com') ||         // mobilecdn.kugou.com, m.kugou.com, media.store.kugou.com
                url.hostname.includes('krcs.kugou.com') ||    // 歌词服务
                
                // 酷我音乐
                url.hostname.includes('kuwo.cn') ||           // www.kuwo.cn, m.kuwo.cn
                
                // 百度音乐（千千音乐）
                url.hostname.includes('taihe.com') ||         // musicapi.taihe.com
                url.hostname.includes('qianqian.com') ||      // 旧域名可能仍在使用
                
                // 通用音频文件扩展名
                url.pathname.includes('.mp3') ||
                url.pathname.includes('.m4a') ||
                url.pathname.includes('.flac')                // 腾讯音乐支持无损
              );
            },
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
})