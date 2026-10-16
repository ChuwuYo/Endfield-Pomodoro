import { describe, expect, it } from "vitest";
import { THEMES } from "../config/themes";
import { ThemePreset } from "../types";
import { applyThemeToRoot } from "./themeDom";

describe("applyThemeToRoot", () => {
    it("writes data-theme, color vars and color-scheme", () => {
        const el = document.createElement("div");
        applyThemeToRoot(ThemePreset.ABYSSAL, el);
        expect(el.dataset.theme).toBe(ThemePreset.ABYSSAL);
        expect(el.style.getPropertyValue("--color-primary")).toBe(
            THEMES[ThemePreset.ABYSSAL]["--color-primary"],
        );
        expect(el.style.colorScheme).toBe("dark");

        applyThemeToRoot(ThemePreset.MIKU, el);
        expect(el.style.colorScheme).toBe("light");
    });

    it("syncs meta theme-color with the theme base color", () => {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = "#fff7d0";
        document.head.appendChild(meta);

        applyThemeToRoot(ThemePreset.ORIGIN, document.createElement("div"));
        expect(meta.content).toBe(THEMES[ThemePreset.ORIGIN]["--color-base"]);
        meta.remove();
    });
});
