/**
 * 订阅鼠标位置：同一帧内的多次 mousemove 合并为一次回调（rAF 内执行）。
 * 返回取消订阅函数。
 */
export const subscribePointerFrame = (
    onFrame: (x: number, y: number) => void,
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

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        if (rafId !== 0) cancelAnimationFrame(rafId);
        rafId = 0;
    };
};
