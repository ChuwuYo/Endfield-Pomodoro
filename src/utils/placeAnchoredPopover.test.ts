import { describe, expect, it } from "vitest";
import { computeAnchoredPopoverPlacement } from "./placeAnchoredPopover";
import { PLAYLIST_MIN_HEIGHT_DESIGN_PX } from "./playlistPopoverLayout";

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
            { minHeight: PLAYLIST_MIN_HEIGHT_DESIGN_PX, maxHeightCap: 240 },
        );
        expect(placement.openBelow).toBe(true);
        expect(placement.top).toBe("188px"); // 100+80+8
        expect(placement.bottom).toBe("auto");
        expect(placement.left).toBe("40px");
        expect(placement.width).toBe("320px");
        expect(Number.parseFloat(placement.maxHeight)).toBeLessThanOrEqual(240);
    });

    it("opens above when below cannot fit the minimum row height", () => {
        // 下方仅 84px < 220，即使上方也不充裕也必须翻上
        const placement = computeAnchoredPopoverPlacement(
            rect(700, 40, 320, 80),
            { width: 800, height: 800 },
            {
                minHeight: PLAYLIST_MIN_HEIGHT_DESIGN_PX,
                maxHeightCap: 240,
                gap: 8,
                padding: 16,
            },
        );
        // spaceBelow = 800-780-8-16 = -4 → 0 available below
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
        const placement = computeAnchoredPopoverPlacement(
            rect(40, 40, 320, 720),
            { width: 800, height: 800 },
            {
                gap: 8,
                padding: 16,
                minHeight: PLAYLIST_MIN_HEIGHT_DESIGN_PX,
                maxHeightCap: 240,
            },
        );
        // spaceBelow = 16 < 220 → 上方打开；spaceAbove = 16
        expect(placement.openBelow).toBe(false);
        expect(Number.parseFloat(placement.maxHeight)).toBe(16);
    });

    it("stays below only when at least minHeight fits under the anchor", () => {
        // 锚点靠上：下方充足
        const below = computeAnchoredPopoverPlacement(
            rect(80, 40, 300, 40),
            { width: 800, height: 700 },
            { minHeight: PLAYLIST_MIN_HEIGHT_DESIGN_PX, maxHeightCap: 240 },
        );
        expect(below.openBelow).toBe(true);

        // 锚点偏下：下方 200 < 220 → 上方
        const above = computeAnchoredPopoverPlacement(
            rect(480, 40, 300, 40),
            { width: 800, height: 700 },
            {
                gap: 8,
                padding: 16,
                minHeight: PLAYLIST_MIN_HEIGHT_DESIGN_PX,
                maxHeightCap: 240,
            },
        );
        // spaceBelow = 700-520-8-16 = 156 < 220
        expect(above.openBelow).toBe(false);
    });
});
