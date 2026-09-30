import { Language } from "../types";

const HTML_LANG: Record<Language, string> = {
    [Language.EN]: "en",
    [Language.CN]: "zh-CN",
    [Language.TW]: "zh-TW",
    [Language.JA]: "ja",
    [Language.KO]: "ko",
};

/** html lang → Language；zh-TW/zh-HK/zh-MO/zh-Hant 归繁体，zh 其余归简体 */
const detectFromTag = (raw: string): Language => {
    const lang = raw.toLowerCase().replaceAll("_", "-");
    if (lang.startsWith("zh")) {
        const region = lang.split("-")[1] ?? "";
        const traditional = ["tw", "hk", "mo", "hant"];
        return traditional.some((r) => region.startsWith(r))
            ? Language.TW
            : Language.CN;
    }
    if (lang.startsWith("ja")) return Language.JA;
    if (lang.startsWith("ko")) return Language.KO;
    return Language.EN;
};

/** App / ErrorBoundary 共用的 Language ↔ html lang 映射 */
export const languageToHtmlLang = (language: Language): string =>
    HTML_LANG[language];

export const htmlLangToLanguage = (
    htmlLang: string | null | undefined,
): Language => detectFromTag(htmlLang ?? "");

/** 与 App DEFAULT_SETTINGS.language 相同的浏览器语言推断 */
export const detectBrowserLanguage = (): Language => {
    const browserLangs =
        typeof navigator !== "undefined"
            ? navigator.languages?.length
                ? navigator.languages
                : [navigator.language]
            : [];
    for (const lang of browserLangs) {
        const detected = detectFromTag(lang ?? "");
        if (detected !== Language.EN) return detected;
    }
    return Language.EN;
};
