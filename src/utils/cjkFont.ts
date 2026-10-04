import { Language } from "../types";

/**
 * CJK 字族按需加载：主 CSS 只内嵌两个拉丁字族，四个 CJK 字族共 1600+ 条
 * @font-face 若全部内联会把首屏 CSS 撑到 1MB 并阻塞渲染。分片本身仍是全量
 * unicode-range 覆盖（构建时全部产出，后续新增汉字无需处理），只是 CSS 按
 * 当前语言取用一份。
 */
const CJK_FONT_CSS: Partial<Record<Language, () => Promise<unknown>>> = {
    [Language.CN]: () =>
        Promise.all([
            import("@fontsource/noto-sans-sc/400.css"),
            import("@fontsource/noto-sans-sc/700.css"),
        ]),
    [Language.TW]: () =>
        Promise.all([
            import("@fontsource/noto-sans-tc/400.css"),
            import("@fontsource/noto-sans-tc/700.css"),
        ]),
    [Language.JA]: () =>
        Promise.all([
            import("@fontsource/noto-sans-jp/400.css"),
            import("@fontsource/noto-sans-jp/700.css"),
        ]),
    [Language.KO]: () =>
        Promise.all([
            import("@fontsource/noto-sans-kr/400.css"),
            import("@fontsource/noto-sans-kr/700.css"),
        ]),
};

/** 无 CJK 字族可加载时（英文）直接 resolve，不产生额外请求 */
export const loadCjkFontCss = async (language: Language): Promise<void> => {
    await CJK_FONT_CSS[language]?.();
};
