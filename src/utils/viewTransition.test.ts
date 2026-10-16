import { afterEach, describe, expect, it, vi } from "vitest";
import { runViewTransition } from "./viewTransition";

type Doc = { startViewTransition?: unknown };
const doc = document as unknown as Doc;

afterEach(() => {
    delete doc.startViewTransition;
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-vt");
    document.head.innerHTML = "";
});

describe("runViewTransition", () => {
    it("updates directly without View Transition support", () => {
        const update = vi.fn();
        runViewTransition(update, "theme");
        expect(update).toHaveBeenCalledTimes(1);
        expect(document.head.querySelector("style")).toBeNull();
    });

    it("wraps the update and suppresses transitions for theme changes", async () => {
        let finish: () => void = () => {};
        const finished = new Promise<void>((resolve) => {
            finish = resolve;
        });
        doc.startViewTransition = (cb: () => void) => {
            cb();
            return { finished };
        };

        const update = vi.fn();
        runViewTransition(update, "theme");
        expect(update).toHaveBeenCalledTimes(1);
        expect(document.documentElement.dataset.vt).toBe("theme");
        expect(document.head.querySelector("style")?.textContent).toContain(
            "transition:none",
        );

        finish();
        await finished;
        await new Promise((r) => setTimeout(r, 5));
        expect(document.documentElement.dataset.vt).toBeUndefined();
        expect(document.head.querySelector("style")).toBeNull();
    });

    it("skips the animation when reduced motion is preferred", () => {
        vi.stubGlobal(
            "matchMedia",
            (query: string) =>
                ({ matches: query.includes("reduce") }) as MediaQueryList,
        );
        const start = vi.fn();
        doc.startViewTransition = start;

        const update = vi.fn();
        runViewTransition(update, "view");
        expect(update).toHaveBeenCalledTimes(1);
        expect(start).not.toHaveBeenCalled();
    });
});
