import React, { useState, useEffect } from 'react';
import { ThemePreset } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import mikuCharImg from '../assets/images/MIKU1.webp';
import mikuLogoImg from '../assets/images/MIKULogo.svg';

// ========== 背景效果组件 ==========

interface MikuHexPatternProps {
    mousePos?: { x: number; y: number };
}

// Miku 六边形网格背景 - 支持鼠标位置高亮
const MikuHexPattern: React.FC<MikuHexPatternProps> = ({ mousePos }) => (
    <div className="absolute inset-0">
        {/* 基础六角形网格 - primary color */}
        <svg width="100%" height="100%" className="absolute inset-0 opacity-[0.15]">
            <defs>
                <pattern id="hex-grid-base" width="40" height="69.28" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                    <path d="M20 0L40 11.54L40 34.64L20 46.18L0 34.64L0 11.54Z" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex-grid-base)" style={{ color: 'var(--color-primary)' }} />
        </svg>
        {/* 鼠标位置高亮六角形 - secondary color 荧光效果 */}
        {mousePos && (
            <svg width="100%" height="100%" className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                <defs>
                    <pattern id="hex-grid-highlight" width="40" height="69.28" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
                        <path d="M20 0L40 11.54L40 34.64L20 46.18L0 34.64L0 11.54Z" fill="none" stroke="var(--color-highlight)" strokeWidth="2" />
                    </pattern>
                    <radialGradient id="mouse-glow" cx={mousePos.x} cy={mousePos.y} r="180" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="white" stopOpacity="1" />
                        <stop offset="40%" stopColor="white" stopOpacity="0.6" />
                        <stop offset="70%" stopColor="white" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    <mask id="mouse-mask">
                        <rect width="100%" height="100%" fill="url(#mouse-glow)" />
                    </mask>
                    {/* 线条发光滤镜 */}
                    <filter id="line-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="var(--color-highlight)" floodOpacity="0.8"/>
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--color-highlight)" floodOpacity="0.4"/>
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--color-highlight)" floodOpacity="0.2"/>
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex-grid-highlight)" mask="url(#mouse-mask)" filter="url(#line-glow)" />
            </svg>
        )}
    </div>
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

// Miku 背景层容器 - 自带鼠标跟踪
export const MikuBackgroundLayer: React.FC = () => {
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile) return;

        let animationFrameId: number;
        const handleMouseMove = (e: MouseEvent) => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                setMousePos({ x: e.clientX, y: e.clientY });
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isMobile]);

    return (
        <>
            <MikuHexPattern mousePos={isMobile ? undefined : mousePos ?? undefined} />
            <div 
                className="absolute -top-20 -right-20 w-96 h-96 border border-theme-highlight rounded-full opacity-20 animate-spin-slow" 
                style={{ borderStyle: 'dashed', animationDuration: '60s' }}
            />
            <MikuEqualizerBars />
        </>
    );
};

// ========== 前景效果组件 ==========

// Miku 前景层效果
export const MikuForegroundLayer: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {/* 前景层现在为空 */}
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
                src={mikuCharImg}
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
                src={mikuLogoImg}
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


