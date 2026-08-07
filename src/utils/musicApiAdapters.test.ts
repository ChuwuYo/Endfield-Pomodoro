import { describe, expect, it } from "vitest";
import { metingAdapter, metingFallbackAdapter } from "./musicApiAdapters";

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

describe("music API URL builders", () => {
    it("encodes reserved characters in playlist query params", () => {
        const url = metingAdapter.buildUrl({
            server: "netease",
            type: "playlist",
            id: "a&b=c d",
        });
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname).toBe(
            "https://api.i-meto.com/meting/api",
        );
        expect(parsed.searchParams.get("server")).toBe("netease");
        expect(parsed.searchParams.get("type")).toBe("playlist");
        expect(parsed.searchParams.get("id")).toBe("a&b=c d");
        expect(url).not.toContain("id=a&b=c");
    });

    it("encodes track URL params on both adapters", () => {
        const primary = metingAdapter.buildTrackUrl!({
            server: "tencent",
            id: "song/1?x=1",
        });
        const fallback = metingFallbackAdapter.buildTrackUrl!({
            server: "tencent",
            id: "song/1?x=1",
        });

        expect(new URL(primary).searchParams.get("type")).toBe("song");
        expect(new URL(primary).searchParams.get("id")).toBe("song/1?x=1");
        expect(new URL(fallback).searchParams.get("id")).toBe("song/1?x=1");
        expect(fallback.startsWith("https://api.injahow.cn/meting/?")).toBe(
            true,
        );
    });
});
