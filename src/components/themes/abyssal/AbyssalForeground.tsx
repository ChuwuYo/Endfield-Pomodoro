import { type FC, useEffect, useRef } from "react";

// 声呐环半径（容器 180x180，圆心对准光标）
const ABYSSAL_RING_RADIUS = 90;

/**
 * Abyssal 主题前景效果 - 声呐回声环
 *
 * 性能：跟随经 ref 直写 transform（纯合成器，不经 React 重渲染）；
 * 环扩散是 transform scale + opacity 关键帧（纯合成器），替代原来的
 * blur 扫描条（blur 每帧全层重绘）。双环错峰 1.2s。
 */
export const AbyssalForeground: FC = () => {
    const followRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 同步直写：浏览器按帧节奏合并派发 mousemove，无需 rAF 转发
        const handleMouseMove = (e: MouseEvent) => {
            if (followRef.current) {
                followRef.current.style.transform = `translate3d(${e.clientX - ABYSSAL_RING_RADIUS}px, ${e.clientY - ABYSSAL_RING_RADIUS}px, 0)`;
            }
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            <div
                ref={followRef}
                className="absolute top-0 left-0 will-change-transform"
                style={{
                    width: `${ABYSSAL_RING_RADIUS * 2}px`,
                    height: `${ABYSSAL_RING_RADIUS * 2}px`,
                    transform: `translate3d(${-ABYSSAL_RING_RADIUS}px, ${-ABYSSAL_RING_RADIUS}px, 0)`,
                }}
            >
                <div className="ef-abyssal-ping absolute inset-0 rounded-full border border-theme-primary/40"></div>
                <div className="ef-abyssal-ping ef-abyssal-ping--late absolute inset-0 rounded-full border border-theme-primary/40"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-theme-primary"></div>
            </div>
        </div>
    );
};
