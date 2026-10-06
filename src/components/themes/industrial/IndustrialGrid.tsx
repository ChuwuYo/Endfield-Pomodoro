/**
 * Industrial 背景层：斜线纸面 + 顶条 + 竖字 + 四角标记 + 右侧大字 + 底尺 + 网点块。
 */
export const IndustrialGrid = () => (
    <>
        <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(45deg, var(--color-dim) 0, var(--color-dim) 1px, transparent 0, transparent 50%)",
                backgroundSize: "20px 20px",
            }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-theme-highlight/20 to-transparent"></div>
        {/* 顶部通条 */}
        <div
            className="absolute top-0 left-0 right-0 h-[6px] opacity-90"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(-45deg, var(--color-secondary) 0 6px, var(--color-accent) 6px 12px)",
            }}
            aria-hidden="true"
        ></div>
        {/* 左侧竖字（桌面端） */}
        <div
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block font-ui-mono text-ui-3xs text-theme-dim/60 tracking-ui-signal select-none"
            style={{ writingMode: "vertical-rl" }}
            aria-hidden="true"
        >
            HEAVY INDUSTRY // SECTOR-07
        </div>
        {/* 四角标记 */}
        <div
            className="absolute top-3 left-3 w-4 h-4 border-t border-l"
            style={{
                borderColor:
                    "color-mix(in srgb, var(--color-dim) 45%, transparent)",
            }}
            aria-hidden="true"
        ></div>
        <div
            className="absolute top-3 right-3 w-4 h-4 border-t border-r"
            style={{
                borderColor:
                    "color-mix(in srgb, var(--color-dim) 45%, transparent)",
            }}
            aria-hidden="true"
        ></div>
        <div
            className="absolute bottom-3 left-3 w-4 h-4 border-b border-l"
            style={{
                borderColor:
                    "color-mix(in srgb, var(--color-dim) 45%, transparent)",
            }}
            aria-hidden="true"
        ></div>
        <div
            className="absolute bottom-3 right-3 w-4 h-4 border-b border-r"
            style={{
                borderColor:
                    "color-mix(in srgb, var(--color-dim) 45%, transparent)",
            }}
            aria-hidden="true"
        ></div>
        {/* 右侧竖排大字（桌面端） */}
        <div
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block font-ui-sans font-bold leading-ui-none select-none"
            style={{
                fontSize: "clamp(4rem, 9vw, 8rem)",
                writingMode: "vertical-rl",
                color: "transparent",
                WebkitTextStroke:
                    "1px color-mix(in srgb, var(--color-dim) 25%, transparent)",
                opacity: 0.8,
            }}
            aria-hidden="true"
        >
            FOCUS
        </div>
        {/* 底部刻度 */}
        <div
            className="absolute bottom-0 left-0 right-0 h-4 opacity-60"
            style={{
                backgroundImage:
                    "linear-gradient(color-mix(in srgb, var(--color-dim) 40%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, var(--color-dim) 40%, transparent) 1px, transparent 1px)",
                backgroundSize: "40px 8px, 8px 4px",
                backgroundRepeat: "repeat-x",
                backgroundPosition: "bottom left, bottom left",
            }}
            aria-hidden="true"
        ></div>
        {/* 右上网点块 */}
        <div
            className="absolute top-10 right-10 w-64 h-64 pointer-events-none"
            style={{
                backgroundImage:
                    "radial-gradient(color-mix(in srgb, var(--color-dim) 35%, transparent) 1px, transparent 1.2px)",
                backgroundSize: "8px 8px",
                maskImage: "linear-gradient(135deg, #000 0%, transparent 70%)",
                WebkitMaskImage:
                    "linear-gradient(135deg, #000 0%, transparent 70%)",
            }}
            aria-hidden="true"
        ></div>
    </>
);
