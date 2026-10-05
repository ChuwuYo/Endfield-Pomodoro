/**
 * Abyssal 主题背景：深海声呐站
 *
 * 构图与 ORIGIN 刻意错开：没有幽灵大字、没有角落信息块，
 * 主体是右侧雷达扫描盘 + 右缘垂直深度尺 + 底部刻度轨 + 点阵浮游群。
 * 动画只有雷达 sweep 的 rotate（纯合成器）；其余全静态，一次光栅化。
 */
export const AbyssalGrid = () => (
    <>
        {/* 波纹底纹（沿用原 SVG 纹理，存在感最低的一层） */}
        <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='%2338bdf8' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: "48px 80px",
            }}
        ></div>
        {/* 深度渐变：顶部微光 → 底部海沟黑 */}
        <div
            className="absolute inset-0"
            style={{
                background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 35%, rgb(0 0 0 / 0.45) 100%)",
            }}
        ></div>
        {/* 点阵浮游群：半调网点 + 右上渐隐（prts halftone 式 mask） */}
        <div
            className="absolute inset-0"
            style={{
                backgroundImage:
                    "radial-gradient(color-mix(in srgb, var(--color-primary) 16%, transparent) 1.2px, transparent 1.4px)",
                backgroundSize: "26px 26px",
                maskImage:
                    "linear-gradient(200deg, black 20%, transparent 75%)",
                WebkitMaskImage:
                    "linear-gradient(200deg, black 20%, transparent 75%)",
            }}
        ></div>
        {/* 雷达扫描盘：右侧圆心，同心刻度环 + 旋转 sweep + 中心点 */}
        <div
            className="absolute top-1/2 -right-40 md:-right-24 -translate-y-1/2 w-[420px] h-[420px] md:w-[560px] md:h-[560px] pointer-events-none"
            aria-hidden="true"
        >
            {/* 刻度环（静态） */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    border: "1px solid color-mix(in srgb, var(--color-primary) 14%, transparent)",
                }}
            ></div>
            <div
                className="absolute inset-[17%] rounded-full"
                style={{
                    border: "1px dashed color-mix(in srgb, var(--color-primary) 12%, transparent)",
                }}
            ></div>
            <div
                className="absolute inset-[33%] rounded-full"
                style={{
                    border: "1px solid color-mix(in srgb, var(--color-primary) 10%, transparent)",
                }}
            ></div>
            {/* 方位刻度：上下左右四短线 */}
            <div
                className="absolute left-1/2 top-[4%] -translate-x-1/2 w-[2px] h-4"
                style={{ background: "var(--color-primary)", opacity: 0.5 }}
            ></div>
            <div
                className="absolute left-1/2 bottom-[4%] -translate-x-1/2 w-[2px] h-4"
                style={{ background: "var(--color-primary)", opacity: 0.5 }}
            ></div>
            <div
                className="absolute top-1/2 left-[4%] -translate-y-1/2 w-4 h-[2px]"
                style={{ background: "var(--color-primary)", opacity: 0.5 }}
            ></div>
            <div
                className="absolute top-1/2 right-[4%] -translate-y-1/2 w-4 h-[2px]"
                style={{ background: "var(--color-primary)", opacity: 0.5 }}
            ></div>
            {/* sweep：conic 扇形，rotate 动画，圆盘 mask 裁边 */}
            <div
                className="ef-abyssal-sweep absolute inset-0 rounded-full will-change-transform"
                style={{
                    background:
                        "conic-gradient(from 0deg, color-mix(in srgb, var(--color-primary) 30%, transparent) 0deg, transparent 70deg)",
                    maskImage:
                        "radial-gradient(circle, black 60%, transparent 71%)",
                    WebkitMaskImage:
                        "radial-gradient(circle, black 60%, transparent 71%)",
                }}
            ></div>
            {/* 中心点 */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--color-primary)" }}
            ></div>
        </div>
        {/* 右缘垂直深度尺（桌面端）：发丝线 + 深度刻度 */}
        <div className="absolute top-40 bottom-32 right-4 hidden md:flex flex-col items-end font-ui-mono text-ui-3xs text-theme-dim/60 tracking-ui-widest">
            <span className="mb-2">DEPTH</span>
            <div className="relative flex-1 w-10">
                <div className="absolute top-0 bottom-0 right-0 w-px bg-theme-dim/30"></div>
                {[
                    { top: "0%", label: "0M" },
                    { top: "30%", label: "-2000M" },
                    { top: "62%", label: "-6000M" },
                    { top: "100%", label: "-10900M" },
                ].map((tick) => (
                    <div
                        key={tick.label}
                        className="absolute right-0 flex items-center gap-1.5"
                        style={{ top: tick.top, transform: "translateY(-50%)" }}
                    >
                        <span>{tick.label}</span>
                        <span className="block w-2 h-[2px] bg-theme-primary/70"></span>
                    </div>
                ))}
            </div>
        </div>
        {/* 底部刻度轨（桌面端）：发丝线 + 刻度 + 青段 */}
        <div className="absolute bottom-12 left-8 right-8 hidden md:block pointer-events-none">
            <div className="flex items-center gap-3 mb-1.5 font-ui-mono text-ui-3xs text-theme-dim/60 tracking-ui-widest">
                <span>TRENCH SURVEY</span>
                <span className="text-theme-primary/80">62%</span>
            </div>
            <div className="relative h-2">
                <div className="absolute inset-x-0 top-0 h-px bg-theme-dim/25"></div>
                <div
                    className="absolute inset-x-0 top-1 h-[5px] opacity-60"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-dim) 50%, transparent) 0 1px, transparent 1px 24px)",
                    }}
                ></div>
                <div className="absolute left-0 top-0 h-[3px] w-1/4 bg-theme-primary/70"></div>
            </div>
        </div>
        {/* 四角收暗，把视线收向内容 */}
        <div
            className="absolute inset-0"
            style={{
                background:
                    "radial-gradient(ellipse at 50% 45%, transparent 35%, rgb(0 0 0 / 0.55) 90%)",
            }}
        ></div>
    </>
);
