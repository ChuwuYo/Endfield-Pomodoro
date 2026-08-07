import type { Settings } from "../types";
import { Language, ThemePreset } from "../types";

/** 解析设置面板时长输入：空/非有限数回退 previous，否则 floor 且 ≥1 */
export const parseDurationInput = (value: string, previous: number): number => {
    if (value.trim() === "") return previous;
    const next = Number(value);
    if (!Number.isFinite(next)) return previous;
    return Math.max(1, Math.floor(next));
};

export type ParseStoredSettingsOptions = {
    /** 传入 Notification.permission；无 Notification API 时传 null/undefined */
    notificationPermission?: NotificationPermission | null;
};

const THEME_VALUES = new Set<string>(Object.values(ThemePreset));
const LANGUAGE_VALUES = new Set<string>(Object.values(Language));

const asPositiveIntMinutes = (value: unknown, fallback: number): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.max(1, Math.floor(value));
};

const asBoolean = (value: unknown, fallback: boolean): boolean =>
    typeof value === "boolean" ? value : fallback;

const asSoundVolume = (value: unknown, fallback: number): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.min(1, Math.max(0, value));
};

const asTheme = (value: unknown, fallback: ThemePreset): ThemePreset => {
    if (value === "LABORATORY") return ThemePreset.AZURE;
    if (typeof value === "string" && THEME_VALUES.has(value)) {
        return value as ThemePreset;
    }
    return fallback;
};

const asLanguage = (value: unknown, fallback: Language): Language => {
    if (typeof value === "string" && LANGUAGE_VALUES.has(value)) {
        return value as Language;
    }
    return fallback;
};

const asMusicConfig = (
    value: unknown,
    fallback: Settings["musicConfig"],
): Settings["musicConfig"] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { ...fallback };
    }
    const raw = value as Record<string, unknown>;
    return {
        server: typeof raw.server === "string" ? raw.server : fallback.server,
        type: typeof raw.type === "string" ? raw.type : fallback.type,
        id: typeof raw.id === "string" ? raw.id : fallback.id,
    };
};

/**
 * 从 localStorage 原始字符串解析设置（字段级校验 + 脏值回退默认）。
 * 脏 JSON / 非对象回退 defaults；LABORATORY → AZURE；通知被拒时关闭开关。
 */
export const parseStoredSettings = (
    saved: string | null,
    defaults: Settings,
    options: ParseStoredSettingsOptions = {},
): Settings => {
    if (!saved)
        return { ...defaults, musicConfig: { ...defaults.musicConfig } };

    try {
        const parsed: unknown = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {
                ...defaults,
                musicConfig: { ...defaults.musicConfig },
            };
        }

        const raw = parsed as Record<string, unknown>;
        const loadedSettings: Settings = {
            workDuration: asPositiveIntMinutes(
                raw.workDuration,
                defaults.workDuration,
            ),
            shortBreakDuration: asPositiveIntMinutes(
                raw.shortBreakDuration,
                defaults.shortBreakDuration,
            ),
            longBreakDuration: asPositiveIntMinutes(
                raw.longBreakDuration,
                defaults.longBreakDuration,
            ),
            autoStartBreaks: asBoolean(
                raw.autoStartBreaks,
                defaults.autoStartBreaks,
            ),
            autoStartWork: asBoolean(raw.autoStartWork, defaults.autoStartWork),
            soundEnabled: asBoolean(raw.soundEnabled, defaults.soundEnabled),
            soundVolume: asSoundVolume(raw.soundVolume, defaults.soundVolume),
            notificationsEnabled: asBoolean(
                raw.notificationsEnabled,
                defaults.notificationsEnabled,
            ),
            language: asLanguage(raw.language, defaults.language),
            theme: asTheme(raw.theme, defaults.theme),
            musicConfig: asMusicConfig(raw.musicConfig, defaults.musicConfig),
        };

        if (
            loadedSettings.notificationsEnabled &&
            options.notificationPermission === "denied"
        ) {
            loadedSettings.notificationsEnabled = false;
        }

        return loadedSettings;
    } catch (e) {
        console.error("Failed to load settings", e);
        return { ...defaults, musicConfig: { ...defaults.musicConfig } };
    }
};
