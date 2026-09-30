import { describe, expect, it } from "vitest";
import { Language } from "../types";
import { translations } from "./i18n";

describe("i18n", () => {
    it("has every translation key in every language", () => {
        const base = Object.keys(translations[Language.EN]).sort();
        for (const lang of Object.values(Language)) {
            expect(
                Object.keys(translations[lang]).sort(),
                `language ${lang}`,
            ).toEqual(base);
        }
    });

    it("has no empty strings", () => {
        for (const lang of Object.values(Language)) {
            for (const [key, value] of Object.entries(translations[lang])) {
                expect(value, `${lang}.${key}`).not.toBe("");
            }
        }
    });
});
