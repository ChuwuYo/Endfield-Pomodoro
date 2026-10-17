export const IndustrialGrid = () => (
    <>
        <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
                backgroundImage:
                    "repeating-linear-gradient(45deg, var(--color-dim) 0, var(--color-dim) 1px, transparent 0, transparent 50%)",
                backgroundSize: "20px 20px",
            }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-theme-highlight/20 to-transparent"></div>
        <div
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block font-ui-mono text-ui-3xs text-theme-dim/60 tracking-ui-signal select-none"
            style={{ writingMode: "vertical-rl" }}
            aria-hidden="true"
        >
            HEAVY INDUSTRY // SECTOR-07
        </div>
        <div
            className="ef-focus-word absolute right-6 top-1/2 -translate-y-1/2 hidden 2xl:block font-ui-sans font-bold leading-ui-none select-none"
            style={{
                fontSize: "clamp(4rem, 9vw, 8rem)",
                writingMode: "vertical-rl",
                color: "transparent",
                WebkitTextStroke:
                    "1px color-mix(in srgb, var(--color-dim) 25%, transparent)",
                opacity: 0.8,
            }}
            aria-hidden="true"
        >
            FOCUS
        </div>
        <div
            className="absolute bottom-8 left-8 w-64 h-64 pointer-events-none"
            style={{
                backgroundImage:
                    "radial-gradient(color-mix(in srgb, var(--color-dim) 35%, transparent) 1px, transparent 1.2px)",
                backgroundSize: "8px 8px",
                maskImage: "linear-gradient(45deg, #000 0%, transparent 70%)",
                WebkitMaskImage:
                    "linear-gradient(45deg, #000 0%, transparent 70%)",
            }}
            aria-hidden="true"
        ></div>
    </>
);
