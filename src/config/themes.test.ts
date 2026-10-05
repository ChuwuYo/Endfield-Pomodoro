import { describe, expect, it } from "vitest";
import { ThemePreset } from "../types";
import { THEME_MODES, ThemeMode, themeModeOf } from "./themes";

describe("theme modes", () => {
    it("covers every preset", () => {
        expect(Object.keys(THEME_MODES).sort()).toEqual(
            Object.values(ThemePreset).sort(),
        );
    });

    it("groups light themes", () => {
        expect(
            [ThemePreset.INDUSTRIAL, ThemePreset.AZURE, ThemePreset.MIKU].map(
                themeModeOf,
            ),
        ).toEqual([ThemeMode.LIGHT, ThemeMode.LIGHT, ThemeMode.LIGHT]);
    });

    it("groups the rest as dark", () => {
        for (const theme of [
            ThemePreset.ORIGIN,
            ThemePreset.ABYSSAL,
            ThemePreset.NEON,
            ThemePreset.MATRIX,
            ThemePreset.TACTICAL,
        ]) {
            expect(themeModeOf(theme)).toBe(ThemeMode.DARK);
        }
    });
});
