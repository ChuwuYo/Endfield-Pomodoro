import { describe, expect, it, vi } from "vitest";
import { Language } from "../types";
import {
    detectBrowserLanguage,
    htmlLangToLanguage,
    languageToHtmlLang,
} from "./languageLocale";

describe("languageLocale", () => {
    it("maps Language to html lang and back", () => {
        expect(languageToHtmlLang(Language.CN)).toBe("zh-CN");
        expect(languageToHtmlLang(Language.TW)).toBe("zh-TW");
        expect(languageToHtmlLang(Language.JA)).toBe("ja");
        expect(languageToHtmlLang(Language.KO)).toBe("ko");
        expect(languageToHtmlLang(Language.EN)).toBe("en");
        expect(htmlLangToLanguage("zh-CN")).toBe(Language.CN);
        expect(htmlLangToLanguage("zh")).toBe(Language.CN);
        expect(htmlLangToLanguage("zh-TW")).toBe(Language.TW);
        expect(htmlLangToLanguage("zh-HK")).toBe(Language.TW);
        expect(htmlLangToLanguage("zh-Hant-TW")).toBe(Language.TW);
        expect(htmlLangToLanguage("ja")).toBe(Language.JA);
        expect(htmlLangToLanguage("ja-JP")).toBe(Language.JA);
        expect(htmlLangToLanguage("ko")).toBe(Language.KO);
        expect(htmlLangToLanguage("ko-KR")).toBe(Language.KO);
        expect(htmlLangToLanguage("en")).toBe(Language.EN);
        expect(htmlLangToLanguage("en-US")).toBe(Language.EN);
        expect(htmlLangToLanguage("")).toBe(Language.EN);
    });

    it("maps real browser/OS tags per BCP 47 and CLDR likely subtags", () => {
        // Intl.Locale("zh-Hant*").maximize() → TW/HK/MO, ("zh").maximize() → Hans-CN
        const table: [string, Language][] = [
            ["zh-CN", Language.CN],
            ["zh-SG", Language.CN],
            ["zh-Hans", Language.CN],
            ["zh-Hans-CN", Language.CN],
            ["zh-TW", Language.TW],
            ["zh-HK", Language.TW],
            ["zh-MO", Language.TW],
            ["zh-Hant", Language.TW],
            ["zh-Hant-TW", Language.TW],
            ["ZH-TW", Language.TW],
            ["zh_tw", Language.TW],
            ["ja", Language.JA],
            ["ja-JP", Language.JA],
            ["ko", Language.KO],
            ["ko-KR", Language.KO],
            ["en-GB", Language.EN],
            ["fr-FR", Language.EN],
            ["", Language.EN],
        ];
        for (const [tag, expected] of table) {
            expect(htmlLangToLanguage(tag), tag).toBe(expected);
        }
    });

    it("round-trips every Language through html lang", () => {
        for (const lang of Object.values(Language)) {
            expect(htmlLangToLanguage(languageToHtmlLang(lang))).toBe(lang);
        }
    });

    it("detects browser language like App defaults", () => {
        expect(typeof detectBrowserLanguage()).toBe("string");
        expect(Object.values(Language)).toContain(detectBrowserLanguage());
    });

    it("picks the first non-English browser language", () => {
        vi.spyOn(navigator, "languages", "get").mockReturnValue([
            "en-US",
            "zh-TW",
        ]);
        expect(detectBrowserLanguage()).toBe(Language.TW);
        vi.spyOn(navigator, "languages", "get").mockReturnValue([
            "ja-JP",
            "ko-KR",
        ]);
        expect(detectBrowserLanguage()).toBe(Language.JA);
        vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
        expect(detectBrowserLanguage()).toBe(Language.EN);
    });
});
