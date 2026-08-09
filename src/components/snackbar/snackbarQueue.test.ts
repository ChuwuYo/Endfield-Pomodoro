import { describe, expect, it } from "vitest";
import { upsertSnackbar } from "./snackbarQueue";

describe("upsertSnackbar", () => {
    it("appends a new snackbar", () => {
        const next = upsertSnackbar([{ id: "a" }], { id: "b" }, 3);
        expect(next.map((t) => t.id)).toEqual(["a", "b"]);
    });

    it("replaces an existing id in place of append order", () => {
        const next = upsertSnackbar(
            [{ id: "a" }, { id: "b" }],
            { id: "a", label: "updated" } as { id: string; label?: string },
            3,
        );
        expect(next).toEqual([{ id: "b" }, { id: "a", label: "updated" }]);
    });

    it("drops the oldest when over the visible cap", () => {
        const next = upsertSnackbar(
            [{ id: "a" }, { id: "b" }, { id: "c" }],
            { id: "d" },
            3,
        );
        expect(next.map((t) => t.id)).toEqual(["b", "c", "d"]);
    });
});
