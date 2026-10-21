/** 刷新页面。单独抽出来是为了测试能替换（jsdom 里改不了 location.reload） */
export const reloadPage = (): void => {
    window.location.reload();
};

/** 当前页面引用的构建资源（入口脚本和样式）是否都在该 SW 的预缓存清单里，即页面已经是新版 */
export const isPageCurrentFor = async (scriptURL: string): Promise<boolean> => {
    const assetPaths = Array.from(
        document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
            'script[type="module"][src], link[rel="stylesheet"][href]',
        ),
        (el) => new URL(el instanceof HTMLScriptElement ? el.src : el.href),
    )
        .filter((url) => url.origin === location.origin)
        .map((url) => url.pathname.replace(/^\//, ""));
    if (assetPaths.length === 0) return false;
    try {
        const response = await fetch(scriptURL, { cache: "no-store" });
        const manifest = await response.text();
        return assetPaths.every((path) => manifest.includes(`"${path}"`));
    } catch {
        return false;
    }
};
