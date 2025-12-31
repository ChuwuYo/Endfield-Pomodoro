import React from 'react';
import { ThemePreset } from '../types';

// ========== 背景效果组件 ==========

// Miku 六边形网格背景
const MikuHexPattern = () => (
    <svg width="100%" height="100%" className="absolute inset-0 opacity-[0.08]">
        <defs>
            <pattern id="hex-grid" width="40" height="69.28" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                <path d="M20 0L40 11.54L40 34.64L20 46.18L0 34.64L0 11.54Z" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-grid)" style={{ color: 'var(--color-primary)' }} />
    </svg>
);

// Miku 频谱条动画
const MikuEqualizerBars = () => {
    const bars = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * -1
    }));

    return (
        <>
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 opacity-20 pointer-events-none overflow-hidden px-10 pb-12">
                {bars.map((bar) => (
                    <div
                        key={bar.id}
                        className="w-4 rounded-t-sm animate-equalizer"
                        style={{
                            backgroundColor: 'var(--color-primary)',
                            animationDelay: `${bar.delay}s`
                        }}
                    />
                ))}
            </div>
            <style>{`
                @keyframes equalizer {
                    0% { height: 10%; opacity: 0.3; }
                    100% { height: 60%; opacity: 0.8; }
                }
                .animate-equalizer {
                    animation: equalizer 1s infinite ease-in-out alternate;
                }
            `}</style>
        </>
    );
};

// Miku 背景层容器
export const MikuBackgroundLayer = () => (
    <>
        <MikuHexPattern />
        <div 
            className="absolute -top-20 -right-20 w-96 h-96 border border-theme-highlight rounded-full opacity-20 animate-spin-slow" 
            style={{ borderStyle: 'dashed', animationDuration: '60s' }}
        />
        <MikuEqualizerBars />
    </>
);

// ========== 前景效果组件 ==========

interface MikuForegroundProps {
    mousePos: { x: number; y: number };
}

// Miku 前景层效果
export const MikuForegroundLayer: React.FC<MikuForegroundProps> = ({ mousePos }) => {
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {/* 跟随鼠标的主光环 */}
            <div className="absolute w-64 h-64 rounded-full transition-transform duration-75 ease-out"
                style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 60%)',
                    opacity: 0.2,
                    mixBlendMode: 'screen'
                }}></div>
            {/* 垂直扫描线 */}
            <div className="absolute inset-0 w-full h-[200%] opacity-[0.08] animate-[miku-scan_5s_linear_infinite]"
                style={{
                    background: 'linear-gradient(to bottom, transparent 0%, var(--color-primary) 50%, transparent 100%)',
                    backgroundSize: '100% 4px'
                }}></div>
            <style>{`@keyframes miku-scan { 0% { transform: translateY(-50%); } 100% { transform: translateY(0%); } }`}</style>
        </div>
    );
};

// ========== 装饰元素组件 ==========

// Miku 角色图片装饰组件
const MikuCharacter: React.FC<{ footerHeight: number }> = ({ footerHeight }) => {
    return (
        <div 
            className="fixed left-1/2 -translate-x-1/2 z-[5] pointer-events-none"
            style={{ bottom: footerHeight }}
        >
            <img
                src="/src/assets/images/MIKU1.webp"
                alt="Miku"
                className="w-24 h-24 md:w-36 md:h-36 object-contain opacity-90"
                draggable={false}
            />
        </div>
    );
};

// Miku Logo 装饰组件
const MikuLogo: React.FC<{ footerHeight: number }> = ({ footerHeight }) => {
    return (
        <div 
            className="fixed right-4 md:right-8 z-[5] pointer-events-none"
            style={{ bottom: footerHeight }}
        >
            <img 
                src="/src/assets/images/MIKULogo.svg" 
                alt="Miku Logo" 
                className="w-10 h-10 md:w-16 md:h-16 opacity-80"
                draggable={false}
            />
        </div>
    );
};

// Miku 主题装饰层容器 - 自动处理主题检查
export const MikuDecorations: React.FC<{ theme: ThemePreset; footerHeight: number }> = ({ theme, footerHeight }) => {
    // 只在 Miku 主题时渲染
    if (theme !== ThemePreset.MIKU) {
        return null;
    }

    return (
        <>
            <MikuCharacter footerHeight={footerHeight} />
            <MikuLogo footerHeight={footerHeight} />
        </>
    );
};


