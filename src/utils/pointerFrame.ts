/**
 * 订阅鼠标位置：同一帧内的多次 mousemove 合并为一次回调（rAF 内执行）。
 * 鼠标离开页面时调用 onLeave，再次移入后由 onFrame 恢复。
 * 返回取消订阅函数。
 */
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
