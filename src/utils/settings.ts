import type { Settings } from "../types";
import { ThemePreset } from "../types";

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

/**
 * 从 localStorage 原始字符串解析设置（浅合并默认值）。
 * 脏 JSON / 非对象回退 defaults；LABORATORY → AZURE；通知被拒时关闭开关。
 */
export const parseStoredSettings = (
    saved: string | null,
    defaults: Settings,
    options: ParseStoredSettingsOptions = {},
): Settings => {
    if (!saved) return { ...defaults };

    try {
        const parsed: unknown = JSON.parse(saved);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { ...defaults };
        }

        const loadedSettings: Settings = {
            ...defaults,
            ...(parsed as Partial<Settings>),
        };

        if (
            loadedSettings.notificationsEnabled &&
            options.notificationPermission === "denied"
        ) {
            loadedSettings.notificationsEnabled = false;
        }

        // Theme Migration: legacy LABORATORY → AZURE
        if ((loadedSettings.theme as string) === "LABORATORY") {
            loadedSettings.theme = ThemePreset.AZURE;
        }

        return loadedSettings;
    } catch {
        return { ...defaults };
    }
};
