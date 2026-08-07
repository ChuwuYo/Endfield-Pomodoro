import React from "react";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
    props,
) => (
    <div className={`relative group ${props.className ?? ""}`}>
        <input
            {...props}
            className={`bg-theme-highlight/20 border border-theme-highlight text-theme-text font-ui-mono text-ui-sm leading-ui-none px-4 h-form-control focus:border-theme-primary w-full min-w-0 placeholder-theme-dim/70 transition-all duration-300`}
        />
        <div className="absolute bottom-0 left-0 h-[1px] w-full bg-theme-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
    </div>
);
