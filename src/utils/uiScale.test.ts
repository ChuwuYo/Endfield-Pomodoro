import { afterEach, describe, expect, it } from "vitest";
import { getUiScale, scalePx } from "./uiScale";

describe("uiScale", () => {
    afterEach(() => {
        document.documentElement.style.removeProperty("--ui-scale");
        document.documentElement.style.fontSize = "";
    });

    it("reads --ui-scale from the documentElement", () => {
        document.documentElement.style.setProperty("--ui-scale", "0.9");
        expect(getUiScale()).toBe(0.9);
        expect(scalePx(100)).toBe(90);
    });

    it("falls back to 1 when --ui-scale is missing or invalid", () => {
        document.documentElement.style.setProperty("--ui-scale", "nope");
        expect(getUiScale()).toBe(1);
        expect(scalePx(36)).toBe(36);
    });
});
