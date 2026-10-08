import React, { useEffect, useRef } from "react";

/** Tactical 前景：十字准星（ref 直写 transform + 坐标直写，不重渲染）。 */
export const TacticalForeground: React.FC = () => {
    const crosshairRef = useRef<HTMLDivElement>(null);
    const coordsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
                <div className="tactical-crosshair__line w-[100vw] h-[1px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="tactical-crosshair__line w-[1px] h-[100vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="tactical-crosshair__ring w-12 h-12 border rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-theme-primary"></div>
                </div>
            </div>
            <div
                ref={coordsRef}
                className="tactical-coords absolute right-4 font-ui-mono text-ui-micro contain-layout contain-paint"
            >
                TARGET_COORDS: [0, 0]
            </div>
        </div>
    );
};
