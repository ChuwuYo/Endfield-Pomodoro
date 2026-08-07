import { describe, expect, it } from "vitest";
import { defaultMusicConfig } from "../config/musicConfig";
import { Language, type Settings, ThemePreset } from "../types";
import { parseDurationInput, parseStoredSettings } from "./settings";

const defaults: Settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    autoStartWork: true,
    soundEnabled: true,
    soundVolume: 0.5,
    notificationsEnabled: false,
    language: Language.CN,
    theme: ThemePreset.INDUSTRIAL,
    musicConfig: defaultMusicConfig,
};

describe("parseDurationInput", () => {
    it("returns previous for blank input", () => {
        expect(parseDurationInput("   ", 25)).toBe(25);
    });

    it("returns previous for non-finite numbers", () => {
        expect(parseDurationInput("abc", 10)).toBe(10);
        expect(parseDurationInput("Infinity", 10)).toBe(10);
    });

    it("floors and clamps to at least 1", () => {
        expect(parseDurationInput("3.9", 25)).toBe(3);
        expect(parseDurationInput("0", 25)).toBe(1);
        expect(parseDurationInput("-2", 25)).toBe(1);
    });
});

describe("parseStoredSettings", () => {
    it("returns defaults when saved is null", () => {
        expect(parseStoredSettings(null, defaults)).toEqual(defaults);
    });

    it("shallow-merges object payloads", () => {
        const result = parseStoredSettings(
            JSON.stringify({ workDuration: 30, soundEnabled: false }),
            defaults,
        );
        expect(result.workDuration).toBe(30);
        expect(result.soundEnabled).toBe(false);
        expect(result.shortBreakDuration).toBe(5);
    });

    it("falls back on invalid JSON or non-object", () => {
        expect(parseStoredSettings("{", defaults)).toEqual(defaults);
        expect(parseStoredSettings("[]", defaults)).toEqual(defaults);
        expect(parseStoredSettings('"x"', defaults)).toEqual(defaults);
    });

    it("disables notifications when permission is denied", () => {
        const result = parseStoredSettings(
            JSON.stringify({ notificationsEnabled: true }),
            defaults,
            { notificationPermission: "denied" },
        );
        expect(result.notificationsEnabled).toBe(false);
    });

    it("migrates LABORATORY theme to AZURE", () => {
        const result = parseStoredSettings(
            JSON.stringify({ theme: "LABORATORY" }),
            defaults,
        );
        expect(result.theme).toBe(ThemePreset.AZURE);
    });
});
