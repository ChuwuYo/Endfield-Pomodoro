import { THEME_MODES, THEMES, ThemeMode } from "../config/themes";
import type { ThemePreset } from "../types";

export const applyThemeToRoot = (
    theme: ThemePreset,
    root: HTMLElement = document.documentElement,
): void => {
    root.dataset.theme = theme;
    for (const [key, value] of Object.entries(THEMES[theme])) {
        root.style.setProperty(key, value);
    }
    root.style.colorScheme =
        THEME_MODES[theme] === ThemeMode.DARK ? "dark" : "light";
    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", THEMES[theme]["--color-base"]);
};
