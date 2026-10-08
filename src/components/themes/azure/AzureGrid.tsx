/** 碎片三角：位置 / 尺寸 / 动画时长 / 延迟 / 是否实心 / 飘动偏移 */
const SHARDS = [
    {
        x: 8,
        y: 18,
        s: 26,
        d: 24,
        delay: 0,
        solid: true,
        dx: 12,
        dy: -18,
        dr: 120,
    },
    {
        x: 22,
        y: 72,
        s: 18,
        d: 28,
        delay: -4,
        solid: false,
        dx: -8,
        dy: -24,
        dr: -90,
    },
    {
        x: 38,
        y: 10,
        s: 14,
        d: 22,
        delay: -7,
        solid: false,
        dx: 15,
        dy: 15,
        dr: 180,
    },
    {
        x: 64,
        y: 82,
        s: 30,
        d: 30,
        delay: -2,
        solid: false,
        dx: -12,
        dy: -30,
        dr: -150,
    },
    {
        x: 78,
        y: 26,
        s: 20,
        d: 25,
        delay: -9,
        solid: true,
        dx: 10,
        dy: -15,
        dr: 90,
    },
    {
        x: 90,
        y: 60,
        s: 16,
        d: 23,
        delay: -5,
        solid: false,
        dx: -15,
        dy: -20,
        dr: -120,
    },
    {
        x: 52,
        y: 48,
        s: 12,
        d: 26,
        delay: -11,
        solid: true,
        dx: 8,
        dy: -25,
        dr: 200,
    },
    {
        x: 15,
        y: 45,
        s: 14,
        d: 27,
        delay: -15,
        solid: false,
        dx: 20,
        dy: -10,
        dr: 140,
    },
    {
        x: 45,
        y: 85,
        s: 22,
        d: 32,
        delay: -8,
        solid: true,
        dx: -18,
        dy: -35,
        dr: -220,
    },
    {
        x: 85,
        y: 15,
        s: 18,
        d: 21,
        delay: -13,
        solid: false,
        dx: -10,
        dy: 20,
        dr: 160,
    },
] as const;

/** Azure 背景：天空渐变 + 云层 + 斜向光带 + 光环 + 漂浮碎片 + 网点。 */
export const AzureGrid = () => (
    <div className="azure-bg absolute inset-0 overflow-hidden pointer-events-none">
        <div className="azure-bg__sky" />
        <div className="azure-bg__cloud azure-bg__cloud--a" />
        <div className="azure-bg__cloud azure-bg__cloud--b" />
        <div className="azure-bg__bands" />
        <div className="azure-bg__dots" />
        <div className="azure-bg__halo">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle
                    cx="100"
                    cy="100"
                    r="86"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="1.5"
                    strokeDasharray="4 6"
                    opacity="0.5"
                />
                <circle
                    cx="100"
                    cy="100"
                    r="72"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="5"
                    opacity="0.35"
                />
                <path
                    d="M100 6 L106 22 L94 22 Z M100 194 L94 178 L106 178 Z M6 100 L22 94 L22 106 Z M194 100 L178 106 L178 94 Z"
                    fill="var(--color-primary)"
                    opacity="0.55"
                />
            </svg>
        </div>
        {SHARDS.map((p, i) => (
            <span
                key={i}
                className={`azure-bg__shard${p.solid ? " azure-bg__shard--solid" : ""}`}
                style={
                    {
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.s}px`,
                        height: `${p.s}px`,
                        animationDuration: `${p.d}s`,
                        animationDelay: `${p.delay}s`,
                        "--dx": `${p.dx}vw`,
                        "--dy": `${p.dy}vh`,
                        "--dr": `${p.dr}deg`,
                    } as React.CSSProperties
                }
            />
        ))}
        <div className="azure-bg__ground" />
    </div>
);
