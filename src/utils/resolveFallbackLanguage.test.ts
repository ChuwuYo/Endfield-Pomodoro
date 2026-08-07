import { afterEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../constants";
import { Language } from "../types";
import { resolveFallbackLanguage } from "./resolveFallbackLanguage";

describe("resolveFallbackLanguage", () => {
    afterEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = "zh-CN";
    });

    it("prefers persisted settings language over html lang", () => {
        window.localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ language: Language.EN }),
        );
        document.documentElement.lang = "zh-CN";
        expect(resolveFallbackLanguage()).toBe(Language.EN);
    });

    it("falls back to html lang when settings are missing", () => {
        document.documentElement.lang = "en";
        expect(resolveFallbackLanguage()).toBe(Language.EN);
        document.documentElement.lang = "zh-CN";
        expect(resolveFallbackLanguage()).toBe(Language.CN);
    });
});
