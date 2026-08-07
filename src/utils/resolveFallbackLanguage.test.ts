import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../constants";
import { Language } from "../types";
import {
    readStoredLanguage,
    resolveFallbackLanguage,
    syncDocumentLanguageBeforeApp,
} from "./resolveFallbackLanguage";

describe("resolveFallbackLanguage", () => {
    afterEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = "zh-CN";
        vi.restoreAllMocks();
    });

    it("prefers persisted settings language over html lang", () => {
        window.localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ language: Language.EN }),
        );
        document.documentElement.lang = "zh-CN";
        expect(resolveFallbackLanguage()).toBe(Language.EN);
        expect(readStoredLanguage()).toBe(Language.EN);
    });

    it("falls back to html lang when settings are missing", () => {
        document.documentElement.lang = "en";
        expect(resolveFallbackLanguage()).toBe(Language.EN);
        document.documentElement.lang = "zh-CN";
        expect(resolveFallbackLanguage()).toBe(Language.CN);
    });
});

describe("syncDocumentLanguageBeforeApp", () => {
    afterEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = "zh-CN";
        vi.restoreAllMocks();
    });

    it("writes persisted language to html lang before app mount", () => {
        window.localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ language: Language.EN }),
        );
        document.documentElement.lang = "zh-CN";
        syncDocumentLanguageBeforeApp();
        expect(document.documentElement.lang).toBe("en");
    });

    it("uses browser language when nothing is stored", () => {
        vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
        document.documentElement.lang = "zh-CN";
        syncDocumentLanguageBeforeApp();
        expect(document.documentElement.lang).toBe("en");
    });
});
