import React, { useEffect, useRef } from "react";
import { subscribePointerFrame } from "../../../utils/pointerFrame";

const INDUSTRIAL_RING_RADIUS = 100;

export const IndustrialForeground: React.FC = () => {
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(
        () =>
            subscribePointerFrame(
                (x, y) => {
                    if (ringRef.current) {
                        ringRef.current.style.opacity = "1";
                        ringRef.current.style.transform = `translate3d(${x - INDUSTRIAL_RING_RADIUS}px, ${y - INDUSTRIAL_RING_RADIUS}px, 0)`;
                    }
                },
                () => {
                    if (ringRef.current) ringRef.current.style.opacity = "0";
                },
            ),
        [],
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <div
                ref={ringRef}
                className="absolute top-0 left-0 transition-opacity duration-300 will-change-transform"
                style={{
                    opacity: 0,
                    transform: `translate3d(${-INDUSTRIAL_RING_RADIUS}px, ${-INDUSTRIAL_RING_RADIUS}px, 0)`,
                    width: `${INDUSTRIAL_RING_RADIUS * 2}px`,
                    height: `${INDUSTRIAL_RING_RADIUS * 2}px`,
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
};
