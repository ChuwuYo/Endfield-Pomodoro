import { type FC, useEffect, useRef } from "react";

// 光晕半径 400px：贴图固定尺寸、圆心居中，ref 平移跟随
const ORIGIN_GLOW_RADIUS = 400;

/** Origin 前景：鼠标光晕（ref 直写 transform，不重渲染）。 */
export const OriginForeground: FC = () => {
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
