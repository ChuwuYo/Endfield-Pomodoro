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

    it("keeps blob, data and same-origin covers", () => {
        for (const src of [
            "blob:http://localhost:3000/abc",
            "data:image/png;base64,AAAA",
            `${window.location.origin}/cover.png`,
        ]) {
            expect(buildMediaSessionArtwork(src)[0]?.src).toBe(src);
        }
    });
});
