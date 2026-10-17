import { Language } from "../types";

/** CJK 字族共 1600+ 条 @font-face，全部内联会让首屏 CSS 达 1MB，因此按语言动态加载 */
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

export const loadCjkFontCss = async (language: Language): Promise<void> => {
    await CJK_FONT_CSS[language]?.();
};
