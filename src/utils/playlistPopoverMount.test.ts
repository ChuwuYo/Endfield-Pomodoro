import { describe, expect, it } from "vitest";
import { isPlaylistPopoverMountReady } from "./playlistPopoverMount";

describe("isPlaylistPopoverMountReady", () => {
    it("is false while loading or errored or empty", () => {
        expect(isPlaylistPopoverMountReady(true, false, true)).toBe(false);
        expect(isPlaylistPopoverMountReady(false, true, true)).toBe(false);
        expect(isPlaylistPopoverMountReady(false, false, false)).toBe(false);
    });

    it("is true only when the player UI (and popover node) can mount", () => {
        expect(isPlaylistPopoverMountReady(false, false, true)).toBe(true);
    });
});
