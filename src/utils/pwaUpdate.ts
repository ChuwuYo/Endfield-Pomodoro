export type PwaUpdateAction = "reload-now" | "reload-on-next-hide";

export const decidePwaUpdateAction = (
    visibilityState: DocumentVisibilityState,
): PwaUpdateAction =>
    visibilityState === "hidden" ? "reload-now" : "reload-on-next-hide";

/** 刷新页面。单独抽出来是为了测试能替换（jsdom 里改不了 location.reload） */
export const reloadPage = (): void => {
    window.location.reload();
};
