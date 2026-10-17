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
