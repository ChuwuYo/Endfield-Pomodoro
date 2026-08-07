import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "danger" | "ghost";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = "primary", className = "", ...props }, ref) => {
        const baseStyle =
            "font-ui-mono uppercase tracking-ui-wider text-ui-sm leading-ui-none px-3 md:px-6 min-h-form-control transition-all duration-200 inline-flex items-center justify-center gap-2 relative group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden whitespace-nowrap active:scale-95";

        const variants = {
            primary:
                "bg-theme-primary text-theme-base hover:bg-theme-primary/90 hover:shadow-[0_0_15px_rgba(var(--color-primary),0.4)] clip-path-slant font-bold",
            secondary:
                "bg-transparent text-theme-primary border border-theme-primary hover:bg-theme-primary/10",
            danger: "bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40",
            ghost: "bg-transparent text-theme-text hover:text-theme-primary hover:bg-theme-highlight/10",
        };

        return (
            <button
                ref={ref}
                className={`${baseStyle} ${variants[variant]} ${className}`}
                {...props}
            >
                <span className="relative z-10 flex items-center gap-2">
                    {children}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
        );
    },
);

Button.displayName = "Button";
