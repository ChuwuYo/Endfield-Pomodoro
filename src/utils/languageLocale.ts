import { Language } from "../types";

/** App / ErrorBoundary 共用的 Language ↔ html lang 映射 */
export const languageToHtmlLang = (language: Language): string =>
    language === Language.CN ? "zh-CN" : "en";

export const htmlLangToLanguage = (
    htmlLang: string | null | undefined,
): Language => {
    const lang = htmlLang?.toLowerCase() ?? "";
    return lang.startsWith("zh") ? Language.CN : Language.EN;
};

/** 与 App DEFAULT_SETTINGS.language 相同的浏览器语言推断 */
export const detectBrowserLanguage = (): Language => {
    const browserLangs =
        typeof navigator !== "undefined"
            ? navigator.languages?.length
                ? navigator.languages
                : [navigator.language]
            : [];
    return browserLangs.some((lang) => lang?.toLowerCase().startsWith("zh"))
        ? Language.CN
        : Language.EN;
};
