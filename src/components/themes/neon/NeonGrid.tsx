export const NeonGrid = () => (
    <>
        <div className="absolute left-1/2 bottom-[10%] -translate-x-1/2 w-[240px] h-[240px] md:w-[320px] md:h-[320px] opacity-90 pointer-events-none">
            <div className="synthwave-sun w-full h-full rounded-full shadow-[0_0_120px_rgba(255,87,34,0.6),inset_0_0_40px_rgba(255,229,59,0.5)] blur-[2px]" />
            <div className="synthwave-sun absolute inset-0 w-full h-full rounded-full mix-blend-screen blur-[8px] opacity-80" />
            <div className="synthwave-sun absolute inset-[10%] rounded-full mix-blend-overlay blur-[12px] opacity-60" />
            <div className="absolute inset-[-20%] rounded-full bg-[#ff5722] opacity-30 blur-[70px]" />
        </div>

        <div
            className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden"
            style={{
                transform:
                    "perspective(500px) rotateX(60deg) translateY(100px) translateZ(-100px)",
                transformOrigin: "bottom",
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            ></div>
            <div
                className="neon-grid-scroll absolute left-0 right-0 bottom-0"
                style={{
                    top: "-40px",
                    backgroundImage:
                        "linear-gradient(0deg, var(--color-primary) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            ></div>
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(transparent 0%, var(--color-base) 100%)",
                }}
            ></div>
        </div>

        <div className="absolute top-0 w-full h-full bg-gradient-to-b from-theme-base via-transparent to-theme-primary/10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-theme-primary/20 blur-[100px] pointer-events-none"></div>
    </>
);
