export const UI_SCALE_CSS_VAR = "--ui-scale";

export const getUiScale = (): number => {
    if (typeof document === "undefined") return 1;
    const raw = getComputedStyle(document.documentElement)
        .getPropertyValue(UI_SCALE_CSS_VAR)
        .trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 1;
};

export const scalePx = (designPx: number): number => designPx * getUiScale();
