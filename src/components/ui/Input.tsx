import React from 'react';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <div className={`relative group ${props.className}`}>
        <input
            {...props}
            className={`bg-theme-highlight/20 border border-theme-highlight text-theme-text font-mono text-sm px-4 h-form-control focus:outline-none focus:border-theme-primary w-full min-w-0 placeholder-theme-dim/70 transition-all duration-300`}
        />
        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-theme-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
    </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select
            {...props}
            className={`bg-theme-highlight/20 border border-theme-highlight text-theme-text font-mono text-sm px-4 py-3 focus:outline-none focus:border-theme-primary w-full appearance-none cursor-pointer hover:bg-theme-highlight/10 transition-colors ${props.className}`}
        >
            {props.children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-theme-primary text-xs">▼</div>
    </div>
);
