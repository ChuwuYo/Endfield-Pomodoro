import { describe, expect, it } from "vitest";
import { upsertToast } from "./toastQueue";

describe("upsertToast", () => {
    it("appends a new toast", () => {
        const next = upsertToast([{ id: "a" }], { id: "b" }, 3);
        expect(next.map((t) => t.id)).toEqual(["a", "b"]);
    });

    it("replaces an existing id in place of append order", () => {
        const next = upsertToast(
            [{ id: "a" }, { id: "b" }],
            { id: "a", label: "updated" } as { id: string; label?: string },
            3,
        );
        expect(next).toEqual([{ id: "b" }, { id: "a", label: "updated" }]);
    });

    it("drops the oldest when over the visible cap", () => {
        const next = upsertToast(
            [{ id: "a" }, { id: "b" }, { id: "c" }],
            { id: "d" },
            3,
        );
        expect(next.map((t) => t.id)).toEqual(["b", "c", "d"]);
    });
});
