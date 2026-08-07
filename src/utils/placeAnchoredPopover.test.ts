import { describe, expect, it } from "vitest";
import { computeAnchoredPopoverPlacement } from "./placeAnchoredPopover";

const rect = (
    top: number,
    left: number,
    width: number,
    height: number,
): DOMRectReadOnly =>
    ({
        top,
        left,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
    }) as DOMRectReadOnly;

describe("computeAnchoredPopoverPlacement", () => {
    it("opens below when there is enough space under the anchor", () => {
        const placement = computeAnchoredPopoverPlacement(
            rect(100, 40, 320, 80),
            { width: 800, height: 900 },
        );
        expect(placement.openBelow).toBe(true);
        expect(placement.top).toBe("188px"); // 100+80+8
        expect(placement.bottom).toBe("auto");
        expect(placement.left).toBe("40px");
        expect(placement.width).toBe("320px");
        expect(Number.parseFloat(placement.maxHeight)).toBeLessThanOrEqual(240);
    });

    it("flips above when the footer leaves little space below", () => {
        const placement = computeAnchoredPopoverPlacement(
            rect(700, 40, 320, 80),
            { width: 800, height: 800 },
            { minHeight: 120, maxHeightCap: 240 },
        );
        expect(placement.openBelow).toBe(false);
        expect(placement.top).toBe("auto");
        expect(placement.bottom).toBe("108px"); // 800 - 700 + 8
        expect(Number.parseFloat(placement.maxHeight)).toBeLessThanOrEqual(240);
    });

    it("clamps horizontal position inside the viewport", () => {
        const placement = computeAnchoredPopoverPlacement(
            rect(100, 700, 320, 40),
            { width: 800, height: 600 },
            { padding: 16 },
        );
        expect(placement.left).toBe("464px"); // 800 - 320 - 16
        expect(placement.width).toBe("320px");
    });

    it("does not force minHeight above the real available space", () => {
        // 锚点几乎贴底：下方仅 ~16px，上方仅 ~16px（均 < minHeight 120）
        const placement = computeAnchoredPopoverPlacement(
            rect(40, 40, 320, 720),
            { width: 800, height: 800 },
            { gap: 8, padding: 16, minHeight: 120, maxHeightCap: 240 },
        );
        // spaceBelow = 800-760-8-16 = 16；spaceAbove = 40-8-16 = 16 → openBelow
        expect(placement.openBelow).toBe(true);
        expect(Number.parseFloat(placement.maxHeight)).toBe(16);
    });
});
