import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { loadCjkFontCss } from "./utils/cjkFont";
import {
    resolveFallbackLanguage,
    syncDocumentLanguageBeforeApp,
} from "./utils/resolveFallbackLanguage";
import "./index.css";
import "remixicon/fonts/remixicon.css";

// 渲染前同步 html lang
syncDocumentLanguageBeforeApp();

const mountApp = () => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
        <React.StrictMode>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </React.StrictMode>,
    );
};

// CJK 字族 CSS 就位后再挂载；加载失败（离线、旧版本 chunk 已下线）时回退系统字体照常挂载
loadCjkFontCss(resolveFallbackLanguage()).then(mountApp, (error: unknown) => {
    console.warn("[Font] CJK font CSS failed to load:", error);
    mountApp();
});
