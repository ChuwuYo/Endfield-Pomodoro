/**
 * 关闭弹出层后是否应把焦点归还给触发器。
 * - 焦点仍在面板内（Esc / 关闭按钮）→ 归还
 * - 焦点已落到 body / 文档根 / null（hide 后常见）→ 归还
 * - 焦点已在外部其它控件（含可聚焦 SVG）→ 不抢
 */
export const shouldRestoreFocusAfterPopoverClose = (
    popover: Element | null,
    active: Element | null,
): boolean => {
    if (active == null) return true;
    if (active === document.body || active === document.documentElement) {
        return true;
    }
    if (popover?.contains(active)) return true;
    return false;
};
