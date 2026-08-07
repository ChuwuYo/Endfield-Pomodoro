/**
 * 全局 UI 密度缩放（与 `src/index.css` 的 `--ui-scale` 同源）。
 * 布局/字号优先走 rem + CSS token；仅在 JS 需要写死 px 时用这里读取。
 */

export const UI_SCALE_CSS_VAR = "--ui-scale";

export const getUiScale = (): number => {
    if (typeof document === "undefined") return 1;
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(UI_SCALE_CSS_VAR)
        .trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 1;
};

/** 设计稿 px（scale=1）→ 当前密度下的 CSS px */
export const scalePx = (designPx: number): number => designPx * getUiScale();

/** 当前根字号（已含 --ui-scale） */
export const getRootFontSizePx = (): number => {
    if (typeof document === "undefined") return 15;
    const raw = getComputedStyle(document.documentElement).fontSize;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 15;
};
