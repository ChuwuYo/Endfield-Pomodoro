/** 刷新页面。单独抽出来是为了测试能替换（jsdom 里改不了 location.reload） */
export const reloadPage = (): void => {
    window.location.reload();
};

/** 当前页面的入口脚本是否在该 SW 的预缓存清单里，即页面已经是新版 */
export const isPageCurrentFor = async (scriptURL: string): Promise<boolean> => {
    const entry = document.querySelector<HTMLScriptElement>(
        'script[type="module"][src]',
    );
    if (!entry) return false;
    const entryPath = new URL(entry.src).pathname.replace(/^\//, "");
    try {
        const response = await fetch(scriptURL, { cache: "no-store" });
        return (await response.text()).includes(`"${entryPath}"`);
    } catch {
        return false;
    }
};
