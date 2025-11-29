import React, { useEffect, useState } from 'react';
import { ThemePreset } from '../types';

export const Panel: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
    <div className={`relative bg-theme-surface/80 border border-theme-highlight backdrop-blur-md ${className} shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300`}>
        {title && (
            <div className="absolute -top-3 left-4 bg-theme-base px-2 text-[10px] font-mono text-theme-primary uppercase tracking-[0.2em] border border-theme-primary/30 flex items-center gap-2 shadow-sm z-20">
                <span className="w-1.5 h-1.5 bg-theme-primary animate-pulse"></span>
                {title}
            </div>
        )}

        {/* 装饰性角落 */}
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-theme-primary"></div>
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-theme-primary"></div>
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-theme-primary"></div>
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-theme-primary"></div>

        {/* 技术标记 */}
        <div className="absolute top-1/2 left-0 w-1 h-8 -translate-y-1/2 bg-theme-highlight/50"></div>
        <div className="absolute top-1/2 right-0 w-1 h-8 -translate-y-1/2 bg-theme-highlight/50"></div>

        <div className="relative z-10 h-full w-full">
            {/* 确保内部内容容器完全拉伸 */}
            {children}
        </div>
    </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({
    children,
    variant = 'primary',
    className = '',
    ...props
}) => {
    // 调整内边距：px-3用于移动端友好，md:px-6用于桌面端
    const baseStyle = "font-mono uppercase tracking-wider text-sm py-2 px-3 md:px-6 transition-all duration-200 flex items-center justify-center gap-2 relative group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95";

    const variants = {
        primary: "bg-theme-primary text-theme-base hover:bg-theme-primary/90 hover:shadow-[0_0_15px_rgba(var(--color-primary),0.4)] clip-path-slant font-bold",
        secondary: "bg-transparent text-theme-primary border border-theme-primary hover:bg-theme-primary/10",
        danger: "bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40",
        ghost: "bg-transparent text-theme-dim hover:text-theme-text hover:bg-theme-highlight"
    };

    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            <span className="relative z-10 flex items-center gap-2">{children}</span>
            {/* 扫描线悬停效果 */}
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
    );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <div className={`relative group ${props.className}`}>
        <input
            {...props}
            className={`bg-theme-highlight/20 border border-theme-highlight text-theme-text font-mono text-sm px-4 py-3 focus:outline-none focus:border-theme-primary w-full min-w-0 placeholder-theme-dim/70 transition-all duration-300`}
        />
        <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-theme-primary group-hover:w-full transition-all duration-500"></div>
    </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <div className="relative">
        <select
            {...props}
            className={`bg-theme-highlight/20 border border-theme-highlight text-theme-text font-mono text-sm px-4 py-3 focus:outline-none focus:border-theme-primary w-full appearance-none cursor-pointer hover:bg-theme-highlight/10 transition-colors ${props.className}`}
        >
            {props.children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-theme-primary text-xs">▼</div>
    </div>
);

/* =========================================================================
   静态/记忆化背景组件
   (这些不会在鼠标移动时重新渲染)
   ========================================================================= */

const OriginGrid = React.memo(() => (
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
));

const AzureGrid = React.memo(() => (
    <>
        <div className="absolute inset-0 opacity-[0.05]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z' fill='%2338bdf8' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '48px 80px'
            }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-theme-base via-transparent to-theme-base opacity-80"></div>
    </>
));

const NeonGrid = React.memo(() => (
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
));

// 在组件外部生成矩阵列以避免重新随机化
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

const MatrixRain = React.memo(() => {
    const columns = matrixColumns;

    return (
        <div className="absolute inset-0 overflow-hidden opacity-20 font-mono text-[10px] leading-3 text-theme-primary select-none pointer-events-none break-all">
            {columns.map((col) => (
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
});

const TacticalGrid = React.memo(() => (
    <div className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(var(--color-dim) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.1 }}></div>
));

// 在组件外部生成皇家粒子
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

const RoyalParticles = React.memo(() => {
    const particles = royalParticles;

    return (
        <>
            {particles.map((p) => (
                <div key={p.id} className="absolute rounded-full bg-theme-primary mix-blend-screen animate-pulse-fast"
                    style={{
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        width: `${p.width}px`,
                        height: `${p.width}px`, // square
                        opacity: 0.05,
                        animationDuration: `${p.animationDuration}s`,
                        filter: 'blur(40px)'
                    }}></div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-tr from-theme-base via-transparent to-theme-highlight/10"></div>
        </>
    );
});

const IndustrialGrid = React.memo(() => (
    <>
        <div className="absolute inset-0 opacity-10"
            style={{
                backgroundImage: 'repeating-linear-gradient(45deg, var(--color-dim) 0, var(--color-dim) 1px, transparent 0, transparent 50%)',
                backgroundSize: '20px 20px'
            }}></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-theme-highlight/20 to-transparent"></div>
    </>
));

const LaboratoryGrid = React.memo(() => (
    <>
        <div className="absolute inset-0 opacity-20"
            style={{
                backgroundImage: 'linear-gradient(var(--color-highlight) 1px, transparent 1px), linear-gradient(90deg, var(--color-highlight) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white/0 mix-blend-overlay"></div>
    </>
));

/* =========================================================================
   鼠标跟踪器和背景容器 (Z-0)
   ========================================================================= */

export const BackgroundLayer: React.FC<{ theme?: ThemePreset }> = ({ theme = ThemePreset.ORIGIN }) => {
    // 我们不在这里跟踪鼠标以防止重新渲染沉重的背景网格。
    // 鼠标跟踪在ForegroundLayer中处理，或者如果需要，通过在body上设置的CSS变量隐式处理，
    // 但这里我们保持静态以确保性能稳定性。

    const renderContent = () => {
        switch (theme) {
            case ThemePreset.AZURE: return <AzureGrid />;
            case ThemePreset.NEON: return <NeonGrid />;
            case ThemePreset.MATRIX: return <MatrixRain />;
            case ThemePreset.TACTICAL: return <TacticalGrid />;
            case ThemePreset.ROYAL: return <RoyalParticles />;
            case ThemePreset.INDUSTRIAL: return <IndustrialGrid />;
            case ThemePreset.LABORATORY: return <LaboratoryGrid />;
            default: return <OriginGrid />;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {renderContent()}
        </div>
    );
};

/* =========================================================================
   前景覆盖层 (Z-50) - 处理交互效果
   ========================================================================= */

export const ForegroundLayer: React.FC<{ theme?: ThemePreset }> = ({ theme = ThemePreset.ORIGIN }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isMobile) return;

        let animationFrameId: number;
        const handleMouseMove = (e: MouseEvent) => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                setMousePos({
                    x: e.clientX,
                    y: e.clientY
                });
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isMobile]);

    // 移动端不渲染鼠标交互层
    if (isMobile) return null;

    if (theme === ThemePreset.ORIGIN) {
        return (
            <div className="fixed inset-0 pointer-events-none z-50 mix-blend-screen">
                <div className="absolute inset-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(var(--color-primary), 0.15), transparent 70%)`
                    }}></div>
            </div>
        );
    }

    if (theme === ThemePreset.TACTICAL) {
        return (
            <div className="fixed inset-0 pointer-events-none z-50">
                {/* 十字准星光标跟随器 */}
                <div className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
                    style={{ left: mousePos.x, top: mousePos.y }}>
                    <div className="w-[100vw] h-[1px] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-[1px] h-[100vh] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-12 h-12 border border-theme-primary/50 rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 bg-theme-primary"></div>
                    </div>
                </div>
                {/* 数据读取 */}
                <div className="absolute bottom-4 right-4 font-mono text-[10px] text-theme-primary/70">
                    TARGET_COORDS: [{mousePos.x}, {mousePos.y}]
                </div>
            </div>
        );
    }

    if (theme === ThemePreset.AZURE) {
        return (
            <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute top-0 left-0 w-full h-[5px] bg-theme-primary/20 blur-sm animate-[scan_3s_ease-in-out_infinite]"></div>
                <style>{`@keyframes scan { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
            </div>
        );
    }

    if (theme === ThemePreset.INDUSTRIAL) {
        return (
            <div className="fixed inset-0 pointer-events-none z-50">
                {/* 跟随光标的警告圆圈 - 无过渡，直接定位 */}
                <div className="absolute top-0 left-0 will-change-transform"
                    style={{
                        transform: `translate(${mousePos.x - 100}px, ${mousePos.y - 100}px)`,
                        width: '200px',
                        height: '200px'
                    }}>
                    <div className="w-full h-full border-4 border-theme-primary/20 rounded-full animate-ping-slow"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-theme-primary/40 rounded-sm rotate-45"></div>
                </div>
                {/* 安全网格覆盖层 */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, var(--color-primary) 0, var(--color-primary) 2px, transparent 0, transparent 20px)',
                        backgroundSize: '40px 40px'
                    }}></div>
            </div>
        );
    }

    if (theme === ThemePreset.LABORATORY) {
        return (
            <div className="fixed inset-0 pointer-events-none z-50">
                {/* 清洁扫描线 */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-theme-primary/30 blur-[2px] animate-[scan_3s_ease-in-out_infinite]"></div>
                {/* 跟随光标的分析聚光灯 - 像ORIGIN一样直接背景定位 */}
                <div className="absolute inset-0"
                    style={{
                        background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, var(--color-primary), transparent 70%)`,
                        opacity: 0.08,
                        mixBlendMode: 'overlay'
                    }}></div>
                {/* 测量十字准星 - 直接定位，无过渡 */}
                <div className="absolute top-0 left-0 will-change-transform"
                    style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
                    <div className="w-[1px] h-4 bg-theme-primary/30 absolute -top-4 left-0"></div>
                    <div className="w-[1px] h-4 bg-theme-primary/30 absolute top-0 left-0"></div>
                    <div className="w-4 h-[1px] bg-theme-primary/30 absolute top-0 -left-4"></div>
                    <div className="w-4 h-[1px] bg-theme-primary/30 absolute top-0 left-0"></div>
                </div>
                <style>{`@keyframes scan { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
            </div>
        );
    }

    return null;
};