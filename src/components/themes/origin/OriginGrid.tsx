/** Origin 背景：终末地工业 HUD（全静态）。 */
export const OriginGrid = () => (
    <>
        {/* 主次网格 */}
        <div
            className="absolute inset-0"
            style={{
                backgroundImage:
                    "linear-gradient(color-mix(in srgb, var(--color-dim) 14%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-dim) 14%, transparent) 1px, transparent 1px), linear-gradient(color-mix(in srgb, var(--color-dim) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-dim) 5%, transparent) 1px, transparent 1px)",
                backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
            }}
        ></div>
        {/* 中心暗角 */}
        <div
            className="absolute inset-0"
            style={{
                background:
                    "radial-gradient(ellipse at 50% 40%, transparent 30%, var(--color-base) 85%)",
            }}
        ></div>
        {/* 左下描边字 */}
        <div
            className="absolute -left-2 font-ui-sans font-bold leading-ui-none select-none"
            style={{
                bottom: "calc(var(--footer-h, 0px) - 0.2em)",
                fontSize: "clamp(5rem, 16vw, 14rem)",
                letterSpacing: "-0.02em",
                color: "transparent",
                WebkitTextStroke:
                    "1px color-mix(in srgb, var(--color-dim) 22%, transparent)",
            }}
            aria-hidden="true"
        >
            ENDFIELD
        </div>
        {/* 左侧竖尺 + 右上信息 */}
        <div
            className="absolute top-28 bottom-24 left-3 w-2 hidden md:block"
            style={{
                backgroundImage:
                    "linear-gradient(color-mix(in srgb, var(--color-dim) 45%, transparent) 1px, transparent 1px)",
                backgroundSize: "100% 16px",
            }}
        ></div>
        <div className="absolute top-28 right-4 hidden md:flex flex-col items-end gap-1 font-ui-mono text-ui-3xs text-theme-dim/60 tracking-ui-widest">
            <span>RHODES_ISLAND // TALOS-II</span>
            <span className="flex items-center gap-2">
                <span className="w-6 h-[2px] bg-theme-primary"></span>
                AIC_SECTOR_04
            </span>
        </div>
        {/* 右下信息块 */}
        <div className="absolute bottom-24 right-4 hidden md:flex flex-col items-end gap-2">
            <div className="flex items-start gap-2">
                <span
                    style={{
                        width: "0.6rem",
                        height: "0.55rem",
                        marginTop: "1px",
                        background: "var(--color-primary)",
                        clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    }}
                    aria-hidden="true"
                ></span>
                <span className="font-ui-mono text-ui-3xs text-theme-dim/60 tracking-ui-widest leading-ui-tight text-right">
                    FOCUS-DEPENDENT PAYLOAD
                    <br />
                    POMODORO INTERFACE
                </span>
            </div>
            <div
                style={{
                    width: "4.5rem",
                    height: "1.5rem",
                    backgroundImage:
                        "radial-gradient(color-mix(in srgb, var(--color-dim) 55%, transparent) 1px, transparent 1.5px)",
                    backgroundSize: "6px 6px",
                }}
                aria-hidden="true"
            ></div>
            <div className="w-72 h-px bg-theme-dim/30"></div>
            <div className="font-ui-mono text-ui-xs text-theme-text/80 tracking-ui-widest">
                OVER PROCRASTINATION / INTO THE ZONE
            </div>
        </div>
    </>
);
