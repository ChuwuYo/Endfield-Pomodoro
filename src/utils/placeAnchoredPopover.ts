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
    gap?: number;
    padding?: number;
    minHeight?: number;
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
    const maxHeightCap = options.maxHeightCap ?? 240;

    const spaceBelow = viewport.height - anchorRect.bottom - gap - padding;
    const spaceAbove = anchorRect.top - gap - padding;
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
