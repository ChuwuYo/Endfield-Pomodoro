import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    /**
     * 传入后渲染自定义增减按钮（原生增减按钮已在 index.css 隐藏）。
     * 按钮不进 tab 序：MDN 的 spinbutton 指引要求文本框是唯一可聚焦部件，
     * 键盘用户用上下方向键，pointer 用户点按钮。
     */
    onStep?: (delta: 1 | -1) => void;
};

export const Input: React.FC<InputProps> = ({
    onStep,
    className,
    value,
    min,
    max,
    ...props
}) => {
    const current = Number(value);
    const lowerBound = Number(min);
    const upperBound = Number(max);
    const canDecrement = Number.isFinite(current)
        ? !Number.isFinite(lowerBound) || current > lowerBound
        : true;
    const canIncrement =
        Number.isFinite(current) && Number.isFinite(upperBound)
            ? current < upperBound
            : true;

    return (
        <div className={`relative group ${className ?? ""}`}>
            <input
                {...props}
                value={value}
                min={min}
                max={max}
                className={`bg-theme-highlight/20 border border-theme-highlight text-theme-text font-ui-mono text-ui-sm leading-ui-none px-4 h-form-control focus:border-theme-primary w-full min-w-0 placeholder-theme-dim/70 transition-all duration-300 ${onStep ? "pr-15" : ""}`}
            />
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-theme-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
            {onStep && (
                <div
                    className="absolute right-0 top-0 h-full flex items-stretch border-l border-theme-highlight/20"
                    aria-hidden="true"
                >
                    <button
                        type="button"
                        tabIndex={-1}
                        disabled={!canDecrement}
                        onClick={() => onStep(-1)}
                        className="w-7 flex items-center justify-center text-theme-dim transition-colors duration-150 hover:text-theme-primary hover:bg-theme-highlight/10 active:text-theme-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-theme-dim cursor-pointer"
                    >
                        <i className="ri-arrow-down-s-fill icon-ui-sm"></i>
                    </button>
                    <button
                        type="button"
                        tabIndex={-1}
                        disabled={!canIncrement}
                        onClick={() => onStep(1)}
                        className="w-7 flex items-center justify-center text-theme-dim transition-colors duration-150 hover:text-theme-primary hover:bg-theme-highlight/10 active:text-theme-primary border-l border-theme-highlight/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-theme-dim cursor-pointer"
                    >
                        <i className="ri-arrow-up-s-fill icon-ui-sm"></i>
                    </button>
                </div>
            )}
        </div>
    );
};
