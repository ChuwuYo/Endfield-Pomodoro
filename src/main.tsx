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

// CJK 字族 CSS 就位后再挂载；加载失败时照常挂载，失败日志由 App 统一记录
loadCjkFontCss(resolveFallbackLanguage()).then(mountApp, mountApp);
