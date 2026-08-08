import type { MusicConfig } from "./config/musicConfig";

export const TimerMode = {
    WORK: "WORK",
    SHORT_BREAK: "SHORT_BREAK",
    LONG_BREAK: "LONG_BREAK",
} as const;
export type TimerMode = (typeof TimerMode)[keyof typeof TimerMode];

export const Language = {
    EN: "EN",
    CN: "CN",
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export const PlayMode = {
    SEQUENCE: "sequence",
    LOOP: "loop",
    RANDOM: "random",
} as const;
export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode];

/**
 * 在线音乐数据获取的失败类别
 *
 * 上游对无效歌单同样返回 HTTP 200（`[]` 或 `{ error: ... }`），
 * 因此必须按响应内容而非状态码区分这两种失败。
 */
export const MusicDataError = {
    /** 所有数据源都表示该歌单不存在、私密或为空 */
    PLAYLIST_UNAVAILABLE: "playlist-unavailable",
    /** 至少一个数据源出现网络错误、超时或非 2xx 响应 */
    SERVICE_UNAVAILABLE: "service-unavailable",
} as const;
export type MusicDataError =
    (typeof MusicDataError)[keyof typeof MusicDataError];

export const ThemePreset = {
    ORIGIN: "ORIGIN",
    ABYSSAL: "ABYSSAL",
    NEON: "NEON",
    MATRIX: "MATRIX",
    TACTICAL: "TACTICAL",
    ROYAL: "ROYAL",
    INDUSTRIAL: "INDUSTRIAL",
    AZURE: "AZURE",
    MIKU: "MIKU",
} as const;
export type ThemePreset = (typeof ThemePreset)[keyof typeof ThemePreset];

/** 主题颜色配置：每个主题预设的 CSS 变量值（10 个 `--color-*` 键必填） */
export interface ThemeColors {
    "--color-base": string;
    "--color-surface": string;
    "--color-highlight": string;
    "--color-primary": string;
    "--color-secondary": string;
    "--color-accent": string;
    "--color-text": string;
    "--color-dim": string;
    "--color-success": string;
    "--color-error": string;
}

export const View = {
    DASHBOARD: "DASHBOARD",
    SETTINGS: "SETTINGS",
} as const;
export type View = (typeof View)[keyof typeof View];

export interface Settings {
    workDuration: number; // in minutes
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartWork: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    notificationsEnabled: boolean;
    language: Language;
    theme: ThemePreset;
    musicConfig: MusicConfig;
}

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}
