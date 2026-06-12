/**
 * Origin 主题网格背景
 */
export const OriginGrid = () => (
    <>
        <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
                backgroundImage:
                    "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }}
        ></div>
        <div className="absolute top-20 left-10 w-32 h-[1px] bg-theme-dim/30"></div>
        <div className="absolute bottom-20 right-10 w-64 h-[1px] bg-theme-dim/30"></div>
        <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] border border-theme-dim/20 rounded-full pointer-events-none"></div>
    </>
);

/**
 * Abyssal 主题波浪背景
 */
export const AbyssalGrid = () => (
    <>
        <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='%2338bdf8' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: "48px 80px",
            }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-theme-base via-transparent to-theme-base opacity-80"></div>
    </>
);

/**
 * Neon 主题透视网格
 */
export const NeonGrid = () => (
    <>
        <style>{`
            @keyframes neon-grid-move {
                0% { background-position: 0 0, 0 0, 0 0; }
                100% { background-position: 0 0, 0 40px, 0 0; }
            }
            .synthwave-sun {
                background: linear-gradient(180deg, #ffe53b 0%, #ff9800 45%, #ff5722 75%, #e91e63 100%);
                mask-image: linear-gradient(
                    to bottom,
                    black 0%, black 50%, 
                    transparent 50%, transparent 53%, 
                    black 53%, black 60%, 
                    transparent 60%, transparent 64%, 
                    black 64%, black 70%, 
                    transparent 70%, transparent 75%, 
                    black 75%, black 80%, 
                    transparent 80%, transparent 86%, 
                    black 86%, black 90%, 
                    transparent 90%, transparent 100%
                );
                -webkit-mask-image: linear-gradient(
                    to bottom,
                    black 0%, black 50%, 
                    transparent 50%, transparent 53%, 
                    black 53%, black 60%, 
                    transparent 60%, transparent 64%, 
                    black 64%, black 70%, 
                    transparent 70%, transparent 75%, 
                    black 75%, black 80%, 
                    transparent 80%, transparent 86%, 
                    black 86%, black 90%, 
                    transparent 90%, transparent 100%
                );
            }
        `}</style>

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

        <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
                background:
                    "linear-gradient(transparent 0%, var(--color-base) 100%), linear-gradient(0deg, var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
                backgroundSize: "100% 100%, 40px 40px, 40px 40px",
                transform:
                    "perspective(500px) rotateX(60deg) translateY(100px) translateZ(-100px)",
                transformOrigin: "bottom",
                animation: "neon-grid-move 1.5s linear infinite",
            }}
        ></div>

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
            <style>{`@keyframes rain { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }`}</style>
        </div>
    );
};

/**
 * Tactical 主题点阵背景
 */
export const TacticalGrid = () => (
    <div
        className="absolute inset-0"
        style={{
            backgroundImage:
                "radial-gradient(var(--color-dim) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            opacity: 0.1,
        }}
    ></div>
);

// 预生成皇家粒子数据
const generateRoyalParticles = () => {
    const randoms = Array.from({ length: 15 }, () => ({
        left: Math.random(),
        top: Math.random(),
        width: Math.random(),
        duration: Math.random(),
    }));

    return Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: randoms[i].left * 100,
        top: randoms[i].top * 100,
        width: randoms[i].width * 100 + 50,
        animationDuration: randoms[i].duration * 5 + 5,
    }));
};

const royalParticles = generateRoyalParticles();

/**
 * Royal 主题粒子效果
 */
export const RoyalParticles = () => (
    <>
        {royalParticles.map((p) => (
            <div
                key={p.id}
                className="absolute rounded-full bg-theme-primary mix-blend-screen animate-pulse-fast"
                style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: `${p.width}px`,
                    height: `${p.width}px`,
                    opacity: 0.05,
                    animationDuration: `${p.animationDuration}s`,
                    filter: "blur(40px)",
                }}
            ></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-tr from-theme-base via-transparent to-theme-highlight/10"></div>
    </>
);

/**
 * Industrial 主题斜线背景
 */
export const IndustrialGrid = () => (
    <>
        <div
            className="absolute inset-0 opacity-10"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(45deg, var(--color-dim) 0, var(--color-dim) 1px, transparent 0, transparent 50%)",
                backgroundSize: "20px 20px",
            }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-theme-highlight/20 to-transparent"></div>
    </>
);

/**
 * Azure 主题网格背景
 */
export const AzureGrid = () => (
    <>
        <div
            className="absolute inset-0 opacity-20"
            style={{
                backgroundImage:
                    "linear-gradient(var(--color-highlight) 1px, transparent 1px), linear-gradient(90deg, var(--color-highlight) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
            }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/0 mix-blend-overlay"></div>
    </>
);
