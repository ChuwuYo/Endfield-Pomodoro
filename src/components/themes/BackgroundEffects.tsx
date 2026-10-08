/**
 * Neon 主题透视网格
 */
export const NeonGrid = () => (
    <>
        {/* Synthwave 夕阳 */}
        <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[240px] h-[240px] md:w-[320px] md:h-[320px] opacity-90 pointer-events-none">
            {/* 太阳本体带边缘模糊和内部发光 */}
            <div className="synthwave-sun w-full h-full rounded-full shadow-[0_0_120px_rgba(255,87,34,0.6),inset_0_0_40px_rgba(255,229,59,0.5)] blur-[2px]" />
            {/* 复古泛光、边缘溢出与发光扭曲叠加层 */}
            <div className="synthwave-sun absolute inset-0 w-full h-full rounded-full mix-blend-screen blur-[8px] opacity-80" />
            {/* 核心虚化过曝高光 */}
            <div className="synthwave-sun absolute inset-[10%] rounded-full mix-blend-overlay blur-[12px] opacity-60" />
            {/* 最外层的氛围光晕 */}
            <div className="absolute inset-[-20%] rounded-full bg-[#ff5722] opacity-30 blur-[70px]" />
        </div>

        {/* 网格滚动：横线层走 transform 平移，竖线与顶部遮罩静态。 */}
        <div
            className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden"
            style={{
                transform:
                    "perspective(500px) rotateX(60deg) translateY(100px) translateZ(-100px)",
                transformOrigin: "bottom",
            }}
        >
            {/* 竖线（静态） */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            ></div>
            {/* 横线层：向下滚动，上方外扩 40px */}
            <div
                className="absolute left-0 right-0 bottom-0"
                style={{
                    top: "-40px",
                    backgroundImage:
                        "linear-gradient(0deg, var(--color-primary) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    animation: "neon-grid-scroll 1.5s linear infinite",
                }}
            ></div>
            {/* 顶部渐隐遮罩（静态，原 background 列表首层） */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(transparent 0%, var(--color-base) 100%)",
                }}
            ></div>
        </div>

        <div className="absolute top-0 w-full h-full bg-gradient-to-b from-theme-base via-transparent to-theme-primary/10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-theme-primary/20 blur-[100px] pointer-events-none"></div>
    </>
);

// 预生成矩阵列数据
const generateMatrixColumns = () => {
    const random1 = Array.from({ length: 40 }, () => Math.random());
    const random2 = Array.from({ length: 40 }, () => Math.random());
    const charRandoms = Array.from({ length: 40 }, () =>
        Array.from({ length: 25 }, () => Math.random()),
    );

    return Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: i * 2.5,
        delay: -random1[i] * 5,
        duration: 2 + random2[i] * 3,
        chars: charRandoms[i]
            .map((r) => String.fromCharCode(0x30a0 + r * 96))
            .join("\n"),
    }));
};

const matrixColumns = generateMatrixColumns();

/**
 * Matrix 主题数字雨
 */
export const MatrixRain = () => {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 font-ui-mono text-ui-micro leading-ui-grid text-theme-primary select-none pointer-events-none break-all">
            {matrixColumns.map((col) => (
                <div
                    key={col.id}
                    className="absolute top-0 w-4 text-center animate-[rain_linear_infinite]"
                    style={{
                        left: `${col.left}%`,
                        animationDuration: `${col.duration}s`,
                        animationDelay: `${col.delay}s`,
                    }}
                >
                    {col.chars}
                </div>
            ))}
        </div>
    );
};
