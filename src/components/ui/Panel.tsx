import React from "react";

export const Panel: React.FC<{
    children: React.ReactNode;
    className?: string;
    title?: React.ReactNode;
}> = ({ children, className = "", title }) => (
    <div
        className={`ef-panel relative bg-theme-surface/80 border border-theme-highlight backdrop-blur-md min-h-0 ${className} shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300`}
    >
        {title && (
            <div className="ef-panel__title absolute -top-3 left-4 bg-theme-base px-2 text-ui-micro font-ui-mono text-theme-primary uppercase tracking-ui-panel border border-theme-primary/30 flex items-center gap-2 shadow-sm z-20">
                <span className="ef-panel__dot w-1.5 h-1.5 bg-theme-primary animate-pulse"></span>
                {title}
            </div>
        )}

        {/* 装饰性角落（ef-panel__corner--* 供主题样式单独改写） */}
        <div className="ef-panel__corner ef-panel__corner--tl absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-theme-primary"></div>
        <div className="ef-panel__corner ef-panel__corner--tr absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-theme-primary"></div>
        <div className="ef-panel__corner ef-panel__corner--bl absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-theme-primary"></div>
        <div className="ef-panel__corner ef-panel__corner--br absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-theme-primary"></div>

        {/* 技术标记 */}
        <div className="ef-panel__mark absolute top-1/2 left-0 w-1 h-8 -translate-y-1/2 bg-theme-highlight/50"></div>
        <div className="ef-panel__mark absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2 bg-theme-highlight/50"></div>

        <div className="relative z-10 h-full min-h-0 w-full">{children}</div>
    </div>
);
