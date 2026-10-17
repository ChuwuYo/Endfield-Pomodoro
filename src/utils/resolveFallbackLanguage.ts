import { STORAGE_KEYS } from "../constants";
import { Language } from "../types";
import {
    detectBrowserLanguage,
    htmlLangToLanguage,
    languageToHtmlLang,
} from "./languageLocale";

const LANGUAGE_VALUES = new Set<string>(Object.values(Language));

export const readStoredLanguage = (): Language | null => {
    try {
        // 显式用 window.localStorage，避免 Node 全局 localStorage 未启用时读到 undefined
        const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return null;
        const language = (parsed as { language?: unknown }).language;
        if (typeof language === "string" && LANGUAGE_VALUES.has(language)) {
            return language as Language;
        }
        return null;
    } catch {
        return null;
    }
};

export const resolveFallbackLanguage = (): Language => {
    const stored = readStoredLanguage();
    if (stored) return stored;
    return htmlLangToLanguage(document.documentElement.lang);
};

export const syncDocumentLanguageBeforeApp = (): void => {
    const language = readStoredLanguage() ?? detectBrowserLanguage();
    document.documentElement.lang = languageToHtmlLang(language);
};
