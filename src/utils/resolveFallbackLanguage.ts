import { STORAGE_KEYS } from "../constants";
import { Language } from "../types";

const LANGUAGE_VALUES = new Set<string>(Object.values(Language));

const readStoredLanguage = (): Language | null => {
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
 * 优先读已持久化的语言设置（首屏崩溃时 App 的 lang effect 可能还没跑）；
 * 再回退到 documentElement.lang / 英文。
 */
export const resolveFallbackLanguage = (): Language => {
    const stored = readStoredLanguage();
    if (stored) return stored;

    const lang = document.documentElement.lang?.toLowerCase() ?? "";
    return lang.startsWith("zh") ? Language.CN : Language.EN;
};
