import { afterEach, describe, expect, it, vi } from "vitest";
import { createId } from "./createId";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("createId", () => {
    it("uses crypto.randomUUID when available", () => {
        vi.stubGlobal("crypto", {
            randomUUID: () => "11111111-2222-3333-4444-555555555555",
        });

        expect(createId()).toBe("11111111-2222-3333-4444-555555555555");
    });

    it("falls back when crypto.randomUUID is missing", () => {
        vi.stubGlobal("crypto", {});

        const id = createId();
        expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/i);
        expect(id.includes("-")).toBe(true);
    });
});
