import { describe, expect, it } from "vitest";
import { metingAdapter } from "./musicApiAdapters";

describe("metingAdapter.parseResponse", () => {
    it("maps primary fields", () => {
        const tracks = metingAdapter.parseResponse([
            {
                id: "1",
                name: "Song A",
                artist: "Artist A",
                url: "https://example.com/a.mp3",
                pic: "https://example.com/a.jpg",
                lrc: "[00:00.00]hi",
                theme: "#fff",
            },
        ]);

        expect(tracks).toEqual([
            {
                id: "1",
                name: "Song A",
                artist: "Artist A",
                url: "https://example.com/a.mp3",
                cover: "https://example.com/a.jpg",
                lrc: "[00:00.00]hi",
                theme: "#fff",
            },
        ]);
    });

    it("falls back to alternate field names and defaults", () => {
        const tracks = metingAdapter.parseResponse([
            {
                song_id: "9",
                title: "Alt",
                author: "Writer",
                cover: "https://example.com/c.jpg",
            },
        ]);

        expect(tracks[0]).toMatchObject({
            id: "9",
            name: "Alt",
            artist: "Writer",
            url: "",
            cover: "https://example.com/c.jpg",
            lrc: "",
        });
    });

    it("throws on empty array", () => {
        expect(() => metingAdapter.parseResponse([])).toThrow("Empty playlist");
    });

    it("throws on non-array", () => {
        expect(() => metingAdapter.parseResponse({ ok: true })).toThrow(
            "Empty playlist",
        );
    });
});
