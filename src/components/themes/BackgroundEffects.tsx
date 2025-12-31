/**
 * Origin 主题网格背景
 */
export const OriginGrid = () => (
    <>
        <div className="absolute inset-0 opacity-[0.03]"
            style={{
                backgroundImage: 'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}></div>
        <div className="absolute top-20 left-10 w-32 h-[1px] bg-theme-dim/20"></div>
        <div className="absolute bottom-20 right-10 w-64 h-[1px] bg-theme-dim/20"></div>
        <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] border border-theme-dim/5 rounded-full pointer-events-none"></div>
    </>
);

/**
 * Azure 主题波浪背景
 */
export const AzureGrid = () => (
    <>
        <div className="absolute inset-0 opacity-[0.05]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='%2338bdf8' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '48px 80px'
            }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-theme-base via-transparent to-theme-base opacity-80"></div>
    </>
);

/**
 * Neon 主题透视网格
 */
export const NeonGrid = () => (
    <>
        <div className="absolute inset-0 opacity-20"
            style={{
                background: 'linear-gradient(transparent 0%, var(--color-base) 100%), linear-gradient(0deg, var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg) translateY(100px) translateZ(-100px)',
                transformOrigin: 'bottom'
            }}></div>
        <div className="absolute top-0 w-full h-full bg-gradient-to-b from-theme-base via-transparent to-theme-primary/10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-theme-primary/20 blur-[100px]"></div>
    </>
);

// 预生成矩阵列数据
const generateMatrixColumns = () => {
    const random1 = Array.from({ length: 40 }, () => Math.random());
    const random2 = Array.from({ length: 40 }, () => Math.random());
    const charRandoms = Array.from({ length: 40 }, () =>
        Array.from({ length: 25 }, () => Math.random())
    );

    return Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: i * 2.5,
        delay: -random1[i] * 5,
        duration: 2 + random2[i] * 3,
        chars: charRandoms[i].map(r => String.fromCharCode(0x30A0 + r * 96)).join('\n')
    }));
};

const matrixColumns = generateMatrixColumns();

/**
 * Matrix 主题数字雨
 */
export const MatrixRain = () => {
    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 font-mono text-[10px] leading-3 text-theme-primary select-none pointer-events-none break-all">
            {matrixColumns.map((col) => (
                <div key={col.id} className="absolute top-0 w-4 text-center animate-[rain_linear_infinite]"
                    style={{
                        left: `${col.left}%`,
                        animationDuration: `${col.duration}s`,
                        animationDelay: `${col.delay}s`,
                    }}>
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
    <div className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(var(--color-dim) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.1 }}></div>
);

// 预生成皇家粒子数据
const generateRoyalParticles = () => {
    const randoms = Array.from({ length: 15 }, () => ({
        left: Math.random(),
        top: Math.random(),
        width: Math.random(),
        duration: Math.random()
    }));

    return Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: randoms[i].left * 100,
        top: randoms[i].top * 100,
        width: randoms[i].width * 100 + 50,
        animationDuration: randoms[i].duration * 5 + 5
    }));
};

const royalParticles = generateRoyalParticles();

/**
 * Royal 主题粒子效果
 */
export const RoyalParticles = () => (
    <>
        {royalParticles.map((p) => (
            <div key={p.id} className="absolute rounded-full bg-theme-primary mix-blend-screen animate-pulse-fast"
                style={{
                    left: `${p.left}%`,
                    top: `${p.top}%`,
                    width: `${p.width}px`,
                    height: `${p.width}px`,
                    opacity: 0.05,
                    animationDuration: `${p.animationDuration}s`,
                    filter: 'blur(40px)'
                }}></div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-tr from-theme-base via-transparent to-theme-highlight/10"></div>
    </>
);

/**
 * Industrial 主题斜线背景
 */
export const IndustrialGrid = () => (
    <>
        <div className="absolute inset-0 opacity-10"
            style={{
                backgroundImage: 'repeating-linear-gradient(45deg, var(--color-dim) 0, var(--color-dim) 1px, transparent 0, transparent 50%)',
                backgroundSize: '20px 20px'
            }}></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-theme-highlight/20 to-transparent"></div>
    </>
);

/**
 * Laboratory 主题网格背景
 */
export const LaboratoryGrid = () => (
    <>
        <div className="absolute inset-0 opacity-20"
            style={{
                backgroundImage: 'linear-gradient(var(--color-highlight) 1px, transparent 1px), linear-gradient(90deg, var(--color-highlight) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/0 mix-blend-overlay"></div>
    </>
);
