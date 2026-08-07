import { describe, expect, it } from "vitest";
import { Language } from "../types";
import {
    detectBrowserLanguage,
    htmlLangToLanguage,
    languageToHtmlLang,
} from "./languageLocale";

describe("languageLocale", () => {
    it("maps Language to html lang and back", () => {
        expect(languageToHtmlLang(Language.CN)).toBe("zh-CN");
        expect(languageToHtmlLang(Language.EN)).toBe("en");
        expect(htmlLangToLanguage("zh-CN")).toBe(Language.CN);
        expect(htmlLangToLanguage("zh")).toBe(Language.CN);
        expect(htmlLangToLanguage("en")).toBe(Language.EN);
        expect(htmlLangToLanguage("en-US")).toBe(Language.EN);
        expect(htmlLangToLanguage("")).toBe(Language.EN);
    });

    it("detects browser language like App defaults", () => {
        expect(typeof detectBrowserLanguage()).toBe("string");
        expect([Language.CN, Language.EN]).toContain(detectBrowserLanguage());
    });
});
