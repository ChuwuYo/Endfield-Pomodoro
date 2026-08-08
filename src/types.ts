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
