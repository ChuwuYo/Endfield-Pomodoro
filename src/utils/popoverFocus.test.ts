import { describe, expect, it } from "vitest";
import { shouldRestoreFocusAfterPopoverClose } from "./popoverFocus";

describe("shouldRestoreFocusAfterPopoverClose", () => {
    it("restores when focus remains inside the popover", () => {
        const popover = document.createElement("div");
        const closeBtn = document.createElement("button");
        popover.appendChild(closeBtn);
        document.body.appendChild(popover);
        expect(shouldRestoreFocusAfterPopoverClose(popover, closeBtn)).toBe(
            true,
        );
        popover.remove();
    });

    it("restores when focus fell back to body after hide", () => {
        const popover = document.createElement("div");
        document.body.appendChild(popover);
        expect(
            shouldRestoreFocusAfterPopoverClose(popover, document.body),
        ).toBe(true);
        popover.remove();
    });

    it("does not steal focus that already moved to another control", () => {
        const popover = document.createElement("div");
        const outside = document.createElement("button");
        document.body.appendChild(popover);
        document.body.appendChild(outside);
        expect(shouldRestoreFocusAfterPopoverClose(popover, outside)).toBe(
            false,
        );
        popover.remove();
        outside.remove();
    });
});
