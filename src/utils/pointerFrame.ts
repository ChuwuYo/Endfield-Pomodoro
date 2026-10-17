export const subscribePointerFrame = (
    onFrame: (x: number, y: number) => void,
    onLeave?: () => void,
): (() => void) => {
    let x = 0;
    let y = 0;
    let rafId = 0;

    const flush = () => {
        rafId = 0;
        onFrame(x, y);
    };

    const handleMouseMove = (e: MouseEvent) => {
        x = e.clientX;
        y = e.clientY;
        if (rafId === 0) rafId = requestAnimationFrame(flush);
    };

    const handleMouseLeave = () => {
        if (rafId !== 0) cancelAnimationFrame(rafId);
        rafId = 0;
        onLeave?.();
    };

    const root = document.documentElement;
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    root.addEventListener("mouseleave", handleMouseLeave);
    return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        root.removeEventListener("mouseleave", handleMouseLeave);
        if (rafId !== 0) cancelAnimationFrame(rafId);
        rafId = 0;
    };
};
