export type AnchoredPopoverPlacement = {
    top?: string;
    bottom?: string;
    left: string;
    width: string;
    maxHeight: string;
    openBelow: boolean;
};

export type PlaceAnchoredPopoverOptions = {
    /** 锚点与面板间距 */
    gap?: number;
    /** 距视口边缘的最小内边距 */
    padding?: number;
    /** 面板最小高度（空间极小时仍保证可滚） */
    minHeight?: number;
    /** 与原先 max-h-60 一致：优先不超过该高度 */
    maxHeightCap?: number;
};

/**
 * Material / Fluent 式锚点定位：优先下方；空间不足则 flip 到上方；
 * max-height 限制在可用视口内，由面板内部滚动。
 */
export const computeAnchoredPopoverPlacement = (
    anchorRect: DOMRectReadOnly,
    viewport: { width: number; height: number },
    options: PlaceAnchoredPopoverOptions = {},
): AnchoredPopoverPlacement => {
    const gap = options.gap ?? 8;
    const padding = options.padding ?? 16;
    const minHeight = options.minHeight ?? 120;
    const maxHeightCap = options.maxHeightCap ?? 240; // Tailwind max-h-60

    const spaceBelow = viewport.height - anchorRect.bottom - gap - padding;
    const spaceAbove = anchorRect.top - gap - padding;
    const openBelow = spaceBelow >= minHeight || spaceBelow >= spaceAbove;
    const available = Math.max(minHeight, openBelow ? spaceBelow : spaceAbove);
    const maxHeight = Math.min(maxHeightCap, available);

    const width = Math.max(
        0,
        Math.min(anchorRect.width, viewport.width - padding * 2),
    );
    const left = Math.max(
        padding,
        Math.min(anchorRect.left, viewport.width - width - padding),
    );

    if (openBelow) {
        return {
            openBelow: true,
            top: `${anchorRect.bottom + gap}px`,
            bottom: "auto",
            left: `${left}px`,
            width: `${width}px`,
            maxHeight: `${maxHeight}px`,
        };
    }

    return {
        openBelow: false,
        top: "auto",
        bottom: `${viewport.height - anchorRect.top + gap}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
    };
};

export const applyAnchoredPopoverPlacement = (
    popover: HTMLElement,
    anchor: HTMLElement,
    options?: PlaceAnchoredPopoverOptions,
): AnchoredPopoverPlacement => {
    const placement = computeAnchoredPopoverPlacement(
        anchor.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        options,
    );

    popover.style.position = "fixed";
    popover.style.margin = "0";
    popover.style.inset = "auto";
    popover.style.top = placement.top ?? "auto";
    popover.style.bottom = placement.bottom ?? "auto";
    popover.style.left = placement.left;
    popover.style.width = placement.width;
    popover.style.maxHeight = placement.maxHeight;
    popover.style.right = "auto";

    return placement;
};
