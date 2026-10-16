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
});
