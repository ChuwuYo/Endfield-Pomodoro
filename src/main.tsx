import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { syncDocumentLanguageBeforeApp } from "./utils/resolveFallbackLanguage";
import "./index.css";
import "remixicon/fonts/remixicon.css";

// 挂载前同步 html lang，缩小首屏崩溃时语言错位窗口
syncDocumentLanguageBeforeApp();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
