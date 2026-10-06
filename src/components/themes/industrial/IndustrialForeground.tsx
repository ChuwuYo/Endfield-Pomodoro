import React, { useEffect, useRef } from "react";

// Industrial 警告圈半径（容器 200x200，圆心对准光标）
const INDUSTRIAL_RING_RADIUS = 100;

/** Industrial 前景：鼠标跟随警告圆圈（ref 直写 transform）。 */
export const IndustrialForeground: React.FC = () => {
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${e.clientX - INDUSTRIAL_RING_RADIUS}px, ${e.clientY - INDUSTRIAL_RING_RADIUS}px, 0)`;
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
                ref={ringRef}
                className="absolute top-0 left-0 will-change-transform"
                style={{
                    transform: `translate3d(${-INDUSTRIAL_RING_RADIUS}px, ${-INDUSTRIAL_RING_RADIUS}px, 0)`,
                    width: `${INDUSTRIAL_RING_RADIUS * 2}px`,
                    height: `${INDUSTRIAL_RING_RADIUS * 2}px`,
                }}
            >
                <div className="w-full h-full border-4 border-theme-primary/20 rounded-full"></div>
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
};
