import React from 'react';

interface MousePos {
    x: number;
    y: number;
}

/**
 * Origin 主题前景效果 - 鼠标光晕
 */
export const OriginForeground: React.FC<{ mousePos: MousePos }> = ({ mousePos }) => (
    <div className="fixed inset-0 pointer-events-none z-50 mix-blend-screen">
        <div className="absolute inset-0 transition-opacity duration-300"
            style={{
                background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent 70%)`
            }}></div>
    </div>
);

/**
 * Tactical 主题前景效果 - 十字准星
 */
export const TacticalForeground: React.FC<{ mousePos: MousePos }> = ({ mousePos }) => (
    <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
            style={{ left: mousePos.x, top: mousePos.y }}>
            <div className="w-[100vw] h-[1px] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="w-[1px] h-[100vh] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="w-12 h-12 border border-theme-primary/50 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-theme-primary"></div>
            </div>
        </div>
        <div className="absolute bottom-4 right-4 font-mono text-[10px] text-theme-primary/70">
            TARGET_COORDS: [{mousePos.x}, {mousePos.y}]
        </div>
    </div>
);

/**
 * Azure 主题前景效果 - 扫描线
 */
export const AzureForeground: React.FC = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-theme-primary/20 blur-sm animate-[scan_3s_ease-in-out_infinite]"></div>
        <style>{`@keyframes scan { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }`}</style>
    </div>
);

/**
 * Industrial 主题前景效果 - 警告圆圈
 */
export const IndustrialForeground: React.FC<{ mousePos: MousePos }> = ({ mousePos }) => (
    <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 will-change-transform"
            style={{
                transform: `translate(${mousePos.x - 100}px, ${mousePos.y - 100}px)`,
                width: '200px',
                height: '200px'
            }}>
            <div className="w-full h-full border-4 border-theme-primary/20 rounded-full animate-ping-slow"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-theme-primary/40 rounded-sm rotate-45"></div>
        </div>
        <div className="absolute inset-0 opacity-[0.02]"
            style={{
                backgroundImage: 'repeating-linear-gradient(45deg, var(--color-primary) 0, var(--color-primary) 2px, transparent 0, transparent 20px)',
                backgroundSize: '40px 40px'
            }}></div>
    </div>
);

/**
 * Laboratory 主题前景效果 - 分析聚光灯
 */
export const LaboratoryForeground: React.FC<{ mousePos: MousePos }> = ({ mousePos }) => (
    <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-theme-primary/30 blur-[2px] animate-[scan_3s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0"
            style={{
                background: `radial-gradient(circle 300px at ${mousePos.x}px ${mousePos.y}px, var(--color-primary), transparent 70%)`,
                opacity: 0.08,
                mixBlendMode: 'overlay'
            }}></div>
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
