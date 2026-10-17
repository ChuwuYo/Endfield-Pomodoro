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

loadCjkFontCss(resolveFallbackLanguage()).then(mountApp, mountApp);
