import { describe, expect, it } from "vitest";
import { buildMediaSessionArtwork } from "./mediaSession";

describe("buildMediaSessionArtwork", () => {
    it("lists a secure cover at several sizes", () => {
        const artwork = buildMediaSessionArtwork("https://example.com/a.jpg");
        expect(artwork.length).toBeGreaterThan(1);
        expect(
            artwork.every((item) => item.src === "https://example.com/a.jpg"),
        ).toBe(true);
    });

    it("falls back to the app icon for an insecure cover", () => {
        const artwork = buildMediaSessionArtwork("http://example.com/a.jpg");
        expect(artwork.some((item) => item.src.startsWith("http:"))).toBe(
            false,
        );
        expect(artwork[0]?.type).toBe("image/png");
    });
});
