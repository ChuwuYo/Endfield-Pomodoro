import { type FC, useEffect, useRef } from "react";
import { subscribePointerFrame } from "../../../utils/pointerFrame";

const ORIGIN_GLOW_RADIUS = 400;

export const OriginForeground: FC = () => {
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(
        () =>
            subscribePointerFrame(
                (x, y) => {
                    if (glowRef.current) {
                        glowRef.current.style.opacity = "1";
                        glowRef.current.style.transform = `translate3d(${x - ORIGIN_GLOW_RADIUS}px, ${y - ORIGIN_GLOW_RADIUS}px, 0)`;
                    }
                },
                () => {
                    if (glowRef.current) glowRef.current.style.opacity = "0";
                },
            ),
        [],
    );

    return (
        <div className="fixed inset-0 pointer-events-none z-50 mix-blend-screen overflow-hidden">
            <div
                ref={glowRef}
                className="absolute top-0 left-0 transition-opacity duration-300 will-change-transform"
                style={{
                    opacity: 0,
                    width: `${ORIGIN_GLOW_RADIUS * 2}px`,
                    height: `${ORIGIN_GLOW_RADIUS * 2}px`,
                    transform: `translate3d(${-ORIGIN_GLOW_RADIUS}px, ${-ORIGIN_GLOW_RADIUS}px, 0)`,
                    background: `radial-gradient(circle ${ORIGIN_GLOW_RADIUS}px at center, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 70%)`,
                }}
            ></div>
        </div>
    );
};
