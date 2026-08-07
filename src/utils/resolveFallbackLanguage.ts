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
    } catch {
        // 损坏的 settings / 无 storage 不影响兜底 UI
    }
    return null;
};

/**
 * 兜底语言优先级：
 * 1) 已持久化设置
 * 2) 当前 html lang（main 在挂载前已按存储/浏览器同步）
 */
export const resolveFallbackLanguage = (): Language => {
    const stored = readStoredLanguage();
    if (stored) return stored;
    return htmlLangToLanguage(document.documentElement.lang);
};

/**
 * 在挂载 React 前同步 <html lang>：
 * - 有持久化设置 → 用设置
 * - 否则 → 与 App DEFAULT_SETTINGS 相同的浏览器推断
 * 避免「index.html 写死 zh-CN + 英文用户首屏崩溃」错成中文兜底。
 */
export const syncDocumentLanguageBeforeApp = (): void => {
    const language = readStoredLanguage() ?? detectBrowserLanguage();
    document.documentElement.lang = languageToHtmlLang(language);
};
