import React from "react";

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    label,
    className = "",
}) => {
    return (
        <label
            className={`
        checkbox-endfield clip-path-slant-sm
        relative flex items-center gap-3 cursor-pointer group 
        px-4 py-3 
        ${className}
      `}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
            />

            <div
                className={`
          relative w-4 h-4 flex items-center justify-center 
          clip-path-slant-sm transition-all duration-150
          ${
              checked
                  ? "checkbox-box checked"
                  : "checkbox-box group-hover:border-theme-primary"
          }
        `}
            >
                <i
                    className="ri-check-line icon-ui-xs font-bold text-theme-base transition-all duration-150"
                    style={{
                        opacity: checked ? 1 : 0,
                        transform: checked ? "scale(1)" : "scale(0.5)",
                    }}
                />

                {checked && (
                    <div className="absolute inset-0 bg-theme-primary/30 blur-sm -z-10" />
                )}
            </div>

            <span
                className={`
          text-ui-xs font-ui-mono uppercase tracking-ui-wider truncate flex-1
          transition-colors duration-150
          ${
              checked
                  ? "text-theme-primary"
                  : "text-theme-text/80 group-hover:text-theme-primary"
          }
        `}
            >
                {label}
            </span>

            <div
                className={`
          w-1.5 h-1.5 transition-all duration-150
          ${
              checked
                  ? "bg-theme-primary shadow-[0_0_4px_var(--color-primary)]"
                  : "bg-theme-dim/50 group-hover:bg-theme-primary/50"
          }
        `}
            />
        </label>
    );
};
