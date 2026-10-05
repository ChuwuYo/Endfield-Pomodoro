/** Abyssal 背景：深海雾（雾团/雨幕/凝水/星尘 + 左缘竖排字）。 */

// 雨幕：28 道雨丝（长度参差，负延迟首屏分散）
const RAINDROPS = [
    { left: 2, delay: -4, duration: 22, length: 42, opacity: 0.3 },
    { left: 5, delay: -17, duration: 27, length: 24, opacity: 0.2 },
    { left: 8, delay: -9, duration: 19, length: 55, opacity: 0.26 },
    { left: 11, delay: -24, duration: 29, length: 30, opacity: 0.18 },
    { left: 14, delay: -2, duration: 21, length: 48, opacity: 0.3 },
    { left: 17, delay: -13, duration: 25, length: 22, opacity: 0.22 },
    { left: 20, delay: -27, duration: 30, length: 52, opacity: 0.2 },
    { left: 23, delay: -7, duration: 20, length: 34, opacity: 0.28 },
    { left: 26, delay: -19, duration: 26, length: 46, opacity: 0.24 },
    { left: 29, delay: -11, duration: 23, length: 26, opacity: 0.18 },
    { left: 32, delay: -31, duration: 33, length: 60, opacity: 0.22 },
    { left: 35, delay: -16, duration: 28, length: 36, opacity: 0.26 },
    { left: 38, delay: -5, duration: 22, length: 44, opacity: 0.2 },
    { left: 41, delay: -23, duration: 31, length: 28, opacity: 0.24 },
    { left: 44, delay: -10, duration: 20, length: 50, opacity: 0.28 },
    { left: 47, delay: -28, duration: 29, length: 32, opacity: 0.18 },
    { left: 50, delay: -3, duration: 24, length: 40, opacity: 0.3 },
    { left: 53, delay: -21, duration: 27, length: 26, opacity: 0.22 },
    { left: 56, delay: -14, duration: 22, length: 54, opacity: 0.2 },
    { left: 59, delay: -33, duration: 32, length: 38, opacity: 0.26 },
    { left: 62, delay: -8, duration: 25, length: 30, opacity: 0.18 },
    { left: 65, delay: -26, duration: 30, length: 46, opacity: 0.28 },
    { left: 68, delay: -12, duration: 21, length: 34, opacity: 0.22 },
    { left: 71, delay: -18, duration: 26, length: 42, opacity: 0.2 },
    { left: 74, delay: -30, duration: 34, length: 58, opacity: 0.24 },
    { left: 77, delay: -6, duration: 23, length: 28, opacity: 0.28 },
    { left: 80, delay: -22, duration: 29, length: 48, opacity: 0.18 },
    { left: 84, delay: -15, duration: 20, length: 32, opacity: 0.26 },
    { left: 87, delay: -34, duration: 33, length: 52, opacity: 0.2 },
    { left: 90, delay: -20, duration: 24, length: 24, opacity: 0.3 },
    { left: 93, delay: -11, duration: 28, length: 44, opacity: 0.22 },
    { left: 96, delay: -29, duration: 31, length: 36, opacity: 0.24 },
    { left: 98, delay: -7, duration: 22, length: 30, opacity: 0.18 },
];

// 玻璃上的凝水（近景，静止，略亮）
const CONDENSATION = [
    { left: 8, top: 80, size: 6, opacity: 0.5 },
    { left: 20, top: 15, size: 4, opacity: 0.4 },
    { left: 35, top: 85, size: 5, opacity: 0.45 },
    { left: 55, top: 78, size: 3, opacity: 0.35 },
    { left: 70, top: 18, size: 5, opacity: 0.42 },
    { left: 93, top: 70, size: 4, opacity: 0.38 },
];

// 浮尘 6 粒
const MOTES = [
    { left: 18, top: 30, delay: -6, duration: 34, size: 5 },
    { left: 64, top: 22, delay: -18, duration: 42, size: 4 },
    { left: 38, top: 64, delay: -11, duration: 38, size: 6 },
    { left: 82, top: 58, delay: -26, duration: 30, size: 4 },
    { left: 10, top: 72, delay: -21, duration: 36, size: 3 },
    { left: 72, top: 78, delay: -9, duration: 32, size: 5 },
];

// 星野：18 点静星（上半区，透明度参差）
const STARS = [
    { left: 4, top: 10, size: 1, opacity: 0.4 },
    { left: 9, top: 22, size: 1, opacity: 0.25 },
    { left: 15, top: 14, size: 2, opacity: 0.35 },
    { left: 21, top: 32, size: 1, opacity: 0.2 },
    { left: 27, top: 12, size: 1, opacity: 0.45 },
    { left: 33, top: 26, size: 2, opacity: 0.3 },
    { left: 40, top: 9, size: 1, opacity: 0.35 },
    { left: 46, top: 20, size: 1, opacity: 0.22 },
    { left: 53, top: 13, size: 2, opacity: 0.4 },
    { left: 58, top: 30, size: 1, opacity: 0.25 },
    { left: 63, top: 11, size: 1, opacity: 0.32 },
    { left: 69, top: 24, size: 2, opacity: 0.28 },
    { left: 75, top: 14, size: 1, opacity: 0.42 },
    { left: 81, top: 28, size: 1, opacity: 0.24 },
    { left: 87, top: 12, size: 2, opacity: 0.36 },
    { left: 92, top: 24, size: 1, opacity: 0.3 },
    { left: 96, top: 15, size: 1, opacity: 0.4 },
    { left: 50, top: 36, size: 1, opacity: 0.2 },
];

export const AbyssalGrid = () => (
    <>
        {/* 星野 */}
        {STARS.map((star, i) => (
            <div
                key={i}
                className="absolute rounded-full"
                style={{
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    background: "var(--color-text)",
                    opacity: star.opacity,
                }}
                aria-hidden="true"
            ></div>
        ))}
        {/* 深度渐变：亮顶 → 深底，给全屏一个亮度跨度*/}
        <div
            className="absolute inset-0"
            style={{
                background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 22%, #1b3550) 0%, #0d1e30 30%, var(--color-base) 58%, rgb(0 0 0 / 0.55) 100%)",
            }}
        ></div>
        {/* 雾团 ×3（页边空白处） */}
        <div
            className="ef-abyssal-drift absolute"
            style={{
                left: "22%",
                bottom: "-32%",
                width: "60vmax",
                height: "34vmax",
                background:
                    "radial-gradient(closest-side, color-mix(in srgb, #cdd6ea 26%, transparent), transparent)",
                animationDuration: "64s",
            }}
        ></div>
        <div
            className="ef-abyssal-drift absolute"
            style={{
                left: "-14%",
                top: "8%",
                width: "26vmax",
                height: "70vmax",
                background:
                    "radial-gradient(closest-side, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent)",
                animationDuration: "48s",
                animationDelay: "-19s",
            }}
        ></div>
        <div
            className="ef-abyssal-drift absolute"
            style={{
                right: "-12%",
                top: "30%",
                width: "24vmax",
                height: "55vmax",
                background:
                    "radial-gradient(closest-side, color-mix(in srgb, #8895b4 18%, transparent), transparent)",
                animationDuration: "80s",
                animationDelay: "-37s",
            }}
        ></div>
        {/* 逆光带：横向压扁的椭圆压在雾团之上，模拟光从水面下来。
            叠在雾团前 → 雾的暗部被点亮、亮部溢出，才有 IB 那张照片的通透。 */}
        <div
            className="absolute inset-0"
            style={{
                background:
                    "radial-gradient(ellipse 88% 30% at 50% 4%, color-mix(in srgb, #e8f1ff 30%, transparent) 0%, color-mix(in srgb, #93b0d8 14%, transparent) 34%, transparent 66%)",
            }}
            aria-hidden="true"
        ></div>
        {/* 雨幕 */}
        {RAINDROPS.map((drop, i) => (
            <div
                key={i}
                className="ef-abyssal-fall absolute top-0"
                style={{
                    left: `${drop.left}%`,
                    width: "1px",
                    height: `${drop.length}px`,
                    background:
                        "linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-text) 70%, transparent))",
                    opacity: drop.opacity,
                    animationDuration: `${drop.duration}s`,
                    animationDelay: `${drop.delay}s`,
                }}
                aria-hidden="true"
            ></div>
        ))}
        {/* 凝水 */}
        {CONDENSATION.map((drop, i) => (
            <div
                key={i}
                className="absolute rounded-full"
                style={{
                    left: `${drop.left}%`,
                    top: `${drop.top}%`,
                    width: `${drop.size}px`,
                    height: `${drop.size}px`,
                    background:
                        "radial-gradient(circle at 35% 30%, #ffffff 0%, color-mix(in srgb, var(--color-text) 55%, transparent) 55%, transparent 75%)",
                    opacity: drop.opacity,
                }}
                aria-hidden="true"
            ></div>
        ))}
        {/* 浮尘 */}
        {MOTES.map((mote, i) => (
            <div
                key={i}
                className="ef-abyssal-drift absolute rounded-full"
                style={{
                    left: `${mote.left}%`,
                    top: `${mote.top}%`,
                    width: `${mote.size}px`,
                    height: `${mote.size}px`,
                    background:
                        "radial-gradient(circle, color-mix(in srgb, var(--color-primary) 55%, transparent), transparent 70%)",
                    animationDuration: `${mote.duration}s`,
                    animationDelay: `${mote.delay}s`,
                }}
                aria-hidden="true"
            ></div>
        ))}
        {/* 左缘竖排字 */}
        <div
            className="absolute left-4 top-1/3 hidden md:block select-none font-ui-sans font-medium text-ui-sm text-theme-text/50"
            style={{
                writingMode: "vertical-rl",
                letterSpacing: "0.5em",
                textShadow:
                    "0 0 20px color-mix(in srgb, var(--color-primary) 35%, transparent)",
            }}
        >
            ABYSSAL
        </div>
        {/* 底部居中 slogan */}
        <div className="absolute bottom-16 left-1/4 right-1/4 hidden md:flex items-center gap-4 select-none">
            <div className="flex-1 h-px bg-theme-dim/25"></div>
            <div className="font-ui-sans text-ui-3xs tracking-ui-signal text-theme-dim/70 whitespace-nowrap">
                A PLACE OF WAKING IN THE DEEP · DIVE-02
            </div>
            <div className="flex-1 h-px bg-theme-dim/25"></div>
        </div>
        {/* 四角收暗：中心留给内容，压到近黑拉开与亮带的跨度 */}
        <div
            className="absolute inset-0"
            style={{
                background:
                    "radial-gradient(ellipse 74% 62% at 50% 42%, transparent 26%, rgb(2 6 12 / 0.34) 62%, rgb(1 3 7 / 0.72) 100%)",
            }}
        ></div>
    </>
);
