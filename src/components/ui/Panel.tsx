import React from 'react';

export const Panel: React.FC<{ children: React.ReactNode; className?: string; title?: React.ReactNode }> = ({ children, className = '', title }) => (
    <div className={`relative bg-theme-surface/80 border border-theme-highlight backdrop-blur-md ${className} shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300`}>
        {title && (
            <div className="absolute -top-3 left-4 bg-theme-base px-2 text-[10px] font-mono text-theme-primary uppercase tracking-[0.2em] border border-theme-primary/30 flex items-center gap-2 shadow-sm z-20">
                <span className="w-1.5 h-1.5 bg-theme-primary animate-pulse"></span>
                {title}
            </div>
        )}

        {/* 装饰性角落 */}
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-theme-primary"></div>
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-theme-primary"></div>
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-theme-primary"></div>
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-theme-primary"></div>

        {/* 技术标记 */}
        <div className="absolute top-1/2 left-0 w-1 h-8 -translate-y-1/2 bg-theme-highlight/50"></div>
        <div className="absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2 bg-theme-highlight/50"></div>

        <div className="relative z-10 h-full w-full">
            {children}
        </div>
    </div>
);
