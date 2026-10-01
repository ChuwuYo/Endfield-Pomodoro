/**
 * 新版什么时候生效：autoUpdate 下新 SW 已经接管，但页面里还是旧 JS，得重新导航一次。
 * 在后台就马上刷新；还在前台就先提示，等切到后台再刷新，免得打断番茄钟或音乐。
 */
export type PwaUpdateAction = "reload-now" | "reload-on-next-hide";

export const decidePwaUpdateAction = (
    visibilityState: DocumentVisibilityState,
): PwaUpdateAction =>
    visibilityState === "hidden" ? "reload-now" : "reload-on-next-hide";

/** 刷新页面。单独抽出来是为了测试能替换（jsdom 里改不了 location.reload） */
export const reloadPage = (): void => {
    window.location.reload();
};
