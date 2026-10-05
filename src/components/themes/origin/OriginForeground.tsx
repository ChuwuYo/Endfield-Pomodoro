import { type FC, useEffect, useRef } from "react";

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
export const OriginForeground: FC = () => {
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
                    background: `radial-gradient(circle ${ORIGIN_GLOW_RADIUS}px at center, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 70%)`,
                }}
            ></div>
        </div>
    );
};
