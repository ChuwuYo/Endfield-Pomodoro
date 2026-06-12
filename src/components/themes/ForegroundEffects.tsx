import React, { useEffect, useRef } from "react";

interface MousePos {
    x: number;
    y: number;
}

// Origin 光晕半径（与原 radial-gradient 的 circle 400px 一致）
const ORIGIN_GLOW_RADIUS = 400;

/**
 * Origin 主题前景效果 - 鼠标光晕
 *
 * 性能优化：原实现把鼠标坐标写进 radial-gradient 的圆心，
 * 每次移动都重新生成渐变并整层重绘。现改为渐变只光栅化一次
 * （固定尺寸贴图、圆心居中），鼠标移动时经 ref 直写 transform
 * 平移贴图（纯合成器操作，不经 React 重渲染）。渐变参数不变，
 * 初始位置同原实现（圆心在视口原点），视觉完全一致。
 */
export const OriginForeground: React.FC = () => {
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 同步直写 transform：浏览器本身按帧节奏合并派发 mousemove，
        // 再经 rAF 转发反而可能多等一帧；样式写入不触发布局，开销极低
        const handleMouseMove = (e: MouseEvent) => {
            if (glowRef.current) {
                glowRef.current.style.transform = `translate3d(${e.clientX - ORIGIN_GLOW_RADIUS}px, ${e.clientY - ORIGIN_GLOW_RADIUS}px, 0)`;
            }
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 mix-blend-screen overflow-hidden">
            <div
                ref={glowRef}
                className="absolute top-0 left-0 transition-opacity duration-300 will-change-transform"
                style={{
                    width: `${ORIGIN_GLOW_RADIUS * 2}px`,
                    height: `${ORIGIN_GLOW_RADIUS * 2}px`,
                    transform: `translate3d(${-ORIGIN_GLOW_RADIUS}px, ${-ORIGIN_GLOW_RADIUS}px, 0)`,
                    background: `radial-gradient(circle ${ORIGIN_GLOW_RADIUS}px at center, color-mix(in srgb, var(--color-primary) 15%, transparent), transparent 70%)`,
                }}
            ></div>
        </div>
    );
};

/**
 * Tactical 主题前景效果 - 十字准星
 *
 * 性能优化：原实现用 left/top 定位（每帧布局重排）并经 React state 逐帧重渲染，
 * 改为 ref 直写 transform 平移（纯合成器）、坐标文本直写 textContent。
 * 原 className 里的 transition-transform duration-75 是死代码（移动走 left/top，
 * transform 从未变化、过渡从未触发），迁移后已删除以保持"瞬时跟随"的原有行为。
 */
export const TacticalForeground: React.FC = () => {
    const crosshairRef = useRef<HTMLDivElement>(null);
    const coordsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 同步直写：浏览器按帧节奏合并派发 mousemove，无需 rAF 转发
        const handleMouseMove = (e: MouseEvent) => {
            if (crosshairRef.current) {
                crosshairRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
            }
            if (coordsRef.current) {
                coordsRef.current.textContent = `TARGET_COORDS: [${e.clientX}, ${e.clientY}]`;
            }
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <div
                ref={crosshairRef}
                className="absolute top-0 left-0 will-change-transform"
                style={{
                    transform: "translate3d(0px, 0px, 0) translate(-50%, -50%)",
                }}
            >
                <div className="w-[100vw] h-[1px] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-[1px] h-[100vh] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-12 h-12 border border-theme-primary/50 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-theme-primary"></div>
                </div>
            </div>
            <div
                ref={coordsRef}
                className="absolute bottom-4 right-4 font-ui-mono text-ui-micro text-theme-primary/70"
            >
                TARGET_COORDS: [0, 0]
            </div>
        </div>
    );
};

/**
 * Abyssal 主题前景效果 - 扫描线
 *
 * 性能优化：原 keyframes 动画 top（每帧触发布局+重绘，叠加 blur 滤镜成本），
 * 改为 transform 平移（纯合成器动画）。容器为 fixed inset-0（桌面端等于视口），
 * translateY(100vh) 与 top: 100% 终点一致，时序/缓动/透明度不变。
 */
export const AbyssalForeground: React.FC = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-theme-primary/20 blur-sm animate-[scan_3s_ease-in-out_infinite]"></div>
        <style>{`@keyframes scan { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }`}</style>
    </div>
);

/**
 * Industrial 主题前景效果 - 警告圆圈
 */
export const IndustrialForeground: React.FC<{ mousePos: MousePos }> = ({
    mousePos,
}) => (
    <div className="fixed inset-0 pointer-events-none z-50">
        <div
            className="absolute top-0 left-0 will-change-transform"
            style={{
                transform: `translate(${mousePos.x - 100}px, ${mousePos.y - 100}px)`,
                width: "200px",
                height: "200px",
            }}
        >
            <div className="w-full h-full border-4 border-theme-primary/20 rounded-full animate-ping-slow"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-theme-primary/40 rounded-sm rotate-45"></div>
        </div>
        <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(45deg, var(--color-primary) 0, var(--color-primary) 2px, transparent 0, transparent 20px)",
                backgroundSize: "40px 40px",
            }}
        ></div>
    </div>
);

// Azure 聚光灯半径（与原 radial-gradient 的 circle 300px 一致）
const AZURE_SPOT_RADIUS = 300;

/**
 * Azure 主题前景效果 - 分析聚光灯
 *
 * 性能优化：聚光灯渐变原先把鼠标坐标写进圆心、每帧重新生成并整层重绘，
 * 改为固定 600x600 贴图（渐变参数不变，opacity/mix-blend-mode 原样保留，
 * 贴图覆盖范围外原本就是全透明，混合结果不变）+ ref 直写 transform 跟随；
 * 角标准星同样由 ref 直写。两者均为纯合成器操作，不再经 React 逐帧重渲染。
 */
export const AzureForeground: React.FC = () => {
    const spotlightRef = useRef<HTMLDivElement>(null);
    const reticleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 同步直写：浏览器按帧节奏合并派发 mousemove，无需 rAF 转发
        const handleMouseMove = (e: MouseEvent) => {
            if (spotlightRef.current) {
                spotlightRef.current.style.transform = `translate3d(${e.clientX - AZURE_SPOT_RADIUS}px, ${e.clientY - AZURE_SPOT_RADIUS}px, 0)`;
            }
            if (reticleRef.current) {
                reticleRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-theme-primary/30 blur-[2px] animate-[scan_3s_ease-in-out_infinite]"></div>
            <div
                ref={spotlightRef}
                className="absolute top-0 left-0 will-change-transform"
                style={{
                    width: `${AZURE_SPOT_RADIUS * 2}px`,
                    height: `${AZURE_SPOT_RADIUS * 2}px`,
                    transform: `translate3d(${-AZURE_SPOT_RADIUS}px, ${-AZURE_SPOT_RADIUS}px, 0)`,
                    background: `radial-gradient(circle ${AZURE_SPOT_RADIUS}px at center, var(--color-primary), transparent 70%)`,
                    opacity: 0.08,
                    mixBlendMode: "overlay",
                }}
            ></div>
            <div
                ref={reticleRef}
                className="absolute top-0 left-0 will-change-transform"
                style={{ transform: "translate3d(0px, 0px, 0)" }}
            >
                <div className="w-[1px] h-4 bg-theme-primary/30 absolute -top-4 left-0"></div>
                <div className="w-[1px] h-4 bg-theme-primary/30 absolute top-0 left-0"></div>
                <div className="w-4 h-[1px] bg-theme-primary/30 absolute top-0 -left-4"></div>
                <div className="w-4 h-[1px] bg-theme-primary/30 absolute top-0 left-0"></div>
            </div>
            {/* 扫描线 keyframes：同 Abyssal，top 布局动画改为合成器 transform */}
            <style>{`@keyframes scan { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }`}</style>
        </div>
    );
};
