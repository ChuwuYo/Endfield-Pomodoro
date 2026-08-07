import { getUiScale } from "./uiScale";

export type AnchoredPopoverPlacement = {
    top?: string;
    bottom?: string;
    left: string;
    width: string;
    maxHeight: string;
    openBelow: boolean;
};

export type PlaceAnchoredPopoverOptions = {
    /** 锚点与面板间距（设计稿 px，apply 时会乘 --ui-scale） */
    gap?: number;
    /** 距视口边缘的最小内边距（设计稿 px） */
    padding?: number;
    /**
     * 面板最小可用高度（设计稿 px）。
     * 仅用于决定是否在下方打开：下方不足则翻到上方；不抬高 max-height。
     */
    minHeight?: number;
    /** 与原先 max-h-60 一致：优先不超过该高度（设计稿 px） */
    maxHeightCap?: number;
};

/**
 * 锚点定位：下方能放下 minHeight 才向下开，否则翻到上方；
 * max-height 限制在真实可用视口内，由面板内部滚动。
 * 纯函数：传入的 options 已是最终 CSS px（含 scale）。
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
    // 下方撑不满最小行数高度 → 必须上方打开（即使上方也偏紧）
    const openBelow = spaceBelow >= minHeight;
    const available = Math.max(0, openBelow ? spaceBelow : spaceAbove);
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
    const scale = getUiScale();
    const placement = computeAnchoredPopoverPlacement(
        anchor.getBoundingClientRect(),
        { width: window.innerWidth, height: window.innerHeight },
        {
            gap: (options?.gap ?? 8) * scale,
            padding: (options?.padding ?? 16) * scale,
            minHeight: (options?.minHeight ?? 120) * scale,
            maxHeightCap: (options?.maxHeightCap ?? 240) * scale,
        },
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
