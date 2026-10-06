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
                <div className="w-[100vw] h-[1px] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-[1px] h-[100vh] bg-theme-primary/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="w-12 h-12 border border-theme-primary/50 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-theme-primary"></div>
                </div>
            </div>
            <div
                ref={coordsRef}
                className="absolute bottom-4 right-4 font-ui-mono text-ui-micro text-theme-primary/70 contain-layout contain-paint"
            >
                TARGET_COORDS: [0, 0]
            </div>
        </div>
    );
};

// Azure 聚光灯半径 300px
const AZURE_SPOT_RADIUS = 300;

/** Azure 前景：聚光灯 + 角标星（ref 直写 transform，不重渲染）。 */
export const AzureForeground: React.FC = () => {
    const spotlightRef = useRef<HTMLDivElement>(null);
    const reticleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
        </div>
    );
};
