import React, { useEffect, useRef } from "react";
import { translations } from "../utils/i18n";
import { resolveFallbackLanguage } from "../utils/resolveFallbackLanguage";
import { Button } from "./ui/Button";

type ErrorBoundaryProps = {
    children: React.ReactNode;
};

type ErrorBoundaryState = {
    error: Error | null;
};

type ErrorFallbackProps = {
    onReload: () => void;
};

/** 根错误兜底：不依赖 App 状态，避免主题/设置本身挂掉时无法恢复 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ onReload }) => {
    const language = resolveFallbackLanguage();
    const t = translations[language];
    const reloadRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        reloadRef.current?.focus();
    }, []);

    return (
        <div
            className="min-h-[100dvh] bg-theme-base text-theme-text font-ui-sans flex flex-col items-center justify-center gap-6 px-6 text-center"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex flex-col items-center gap-2 max-w-md">
                <i
                    className="ri-error-warning-line icon-ui-display text-theme-primary"
                    aria-hidden="true"
                />
                <h1 className="text-ui-xl font-ui-mono font-bold tracking-ui-wider uppercase">
                    {t.ERROR_BOUNDARY_TITLE}
                </h1>
                <p className="text-ui-sm text-theme-dim font-ui-mono leading-relaxed">
                    {t.ERROR_BOUNDARY_MESSAGE}
                </p>
            </div>
            <Button
                ref={reloadRef}
                type="button"
                variant="primary"
                onClick={onReload}
            >
                {t.ERROR_BOUNDARY_RELOAD}
            </Button>
        </div>
    );
};

/**
 * 根级错误边界：捕获渲染期异常，避免 PWA/白屏无法恢复。
 * 恢复路径仅 reload（不清 localStorage，保留设置与会话数据）。
 */
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    private handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.error) {
            return <ErrorFallback onReload={this.handleReload} />;
        }
        return this.props.children;
    }
}
