import React, { useEffect, useRef } from "react";

/** 单次点击碎片数量 */
const TAP_SHARDS = 5;
/** 点击特效持续时长（ms） */
const TAP_LIFETIME = 600;

/** Azure 前景：点击处生成光环 + 三角碎片爆散（直接操作 DOM，不重渲染）。 */
export const AzureForeground: React.FC = () => {
    const layerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const layer = layerRef.current;
        if (!layer) return;

        const handlePointerDown = (e: PointerEvent) => {
            const burst = document.createElement("div");
            burst.className = "azure-tap";
            burst.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

            const ring = document.createElement("span");
            ring.className = "azure-tap__ring";
            burst.appendChild(ring);

            const offset = Math.random() * 360;
            for (let i = 0; i < TAP_SHARDS; i++) {
                const shard = document.createElement("span");
                shard.className = "azure-tap__shard";
                shard.style.setProperty(
                    "--a",
                    `${offset + (360 / TAP_SHARDS) * i}deg`,
                );
                burst.appendChild(shard);
            }

            layer.appendChild(burst);
            window.setTimeout(() => burst.remove(), TAP_LIFETIME);
        };

        window.addEventListener("pointerdown", handlePointerDown, {
            passive: true,
        });
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            layer.replaceChildren();
        };
    }, []);

    return (
        <div
            ref={layerRef}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        />
    );
};
