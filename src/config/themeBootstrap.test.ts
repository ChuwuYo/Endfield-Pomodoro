import { afterEach, describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../constants";
import { ThemePreset } from "../types";
import { buildThemeBootstrapScript } from "./themeBootstrap";
import { DEFAULT_THEME, THEMES } from "./themes";

const run = () => {
    new Function(buildThemeBootstrapScript())();
};

const root = document.documentElement;

afterEach(() => {
    localStorage.clear();
    root.removeAttribute("data-theme");
    root.removeAttribute("style");
});

describe("theme bootstrap script", () => {
    it("applies the stored theme before mount", () => {
        localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ theme: ThemePreset.ORIGIN }),
        );
        run();
        expect(root.dataset.theme).toBe(ThemePreset.ORIGIN);
        expect(root.style.getPropertyValue("--color-base")).toBe(
            THEMES[ThemePreset.ORIGIN]["--color-base"],
        );
        expect(root.style.colorScheme).toBe("dark");
    });

    it("syncs meta theme-color before mount", () => {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = "#fff7d0";
        document.head.appendChild(meta);
        localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ theme: ThemePreset.TACTICAL }),
        );
        run();
        expect(meta.content).toBe(THEMES[ThemePreset.TACTICAL]["--color-base"]);
        meta.remove();
    });

    it("maps the legacy LABORATORY theme to AZURE", () => {
        localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ theme: "LABORATORY" }),
        );
        run();
        expect(root.dataset.theme).toBe(ThemePreset.AZURE);
        expect(root.style.colorScheme).toBe("light");
    });

    it("falls back to the default theme on bad data", () => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, "{not json");
        run();
        expect(root.dataset.theme).toBe(DEFAULT_THEME);

        localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ theme: "toString" }),
        );
        run();
        expect(root.dataset.theme).toBe(DEFAULT_THEME);
    });
});
