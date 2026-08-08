import { describe, expect, it } from "vitest";
import {
    EmptyPlaylistError,
    getAdapters,
    metingAdapter,
    metingFallbackAdapter,
} from "./musicApiAdapters";

/**
 * 以下载荷复刻两个上游真实响应的结构（2026-08 实测）：
 * 两者都不返回 id/song_id，歌曲 id 只存在于 url 的查询参数中。
 *
 * i-meto 会在 id 之后再附加一个签名参数，这个「id 不在末尾」的形状正是夹具要保住的
 * 属性——它能挡住用贪婪正则截取 id 的错误实现。签名值本身不参与断言，
 * 故用占位符代替真实签名（真实签名有时效，写死进仓库既无意义也会触发密钥扫描）。
 */
const injahowPlaylistItem = {
    name: "ヨヅリナ - STUDY WITH MIKU ver. -",
    artist: "STUDY WITH MIKU",
    url: "https://api.injahow.cn/meting/?server=netease&type=url&id=3322640395",
    pic: "https://api.injahow.cn/meting/?server=netease&type=pic&id=109951172354364941",
    lrc: "https://api.injahow.cn/meting/?server=netease&type=lrc&id=3322640395",
};

const imetoPlaylistItem = {
    title: "三日月ステップ - STUDY WITH MIKU ver. -",
    author: "STUDY WITH MIKU",
    url: "https://api.i-meto.com/meting/api?server=netease&type=url&id=3406945542&auth=placeholder-signature",
    pic: "https://api.i-meto.com/meting/api?server=netease&type=pic&id=109951173564186500&auth=placeholder-signature",
    lrc: "https://api.i-meto.com/meting/api?server=netease&type=lrc&id=3406945542&auth=placeholder-signature",
};

describe("track id recovery from real upstream payloads", () => {
    it("recovers the song id from the injahow url when no id field is present", () => {
        const [track] = metingFallbackAdapter.parseResponse([
            injahowPlaylistItem,
        ]);

        expect(track.id).toBe("3322640395");
        expect(track.name).toBe("ヨヅリナ - STUDY WITH MIKU ver. -");
    });

    it("recovers the song id from the i-meto signed url", () => {
        const [track] = metingAdapter.parseResponse([imetoPlaylistItem]);

        expect(track.id).toBe("3406945542");
        expect(track.name).toBe("三日月ステップ - STUDY WITH MIKU ver. -");
    });

    it("prefers an explicit id field over the url derived one", () => {
        const [track] = metingAdapter.parseResponse([
            { ...injahowPlaylistItem, id: "explicit" },
        ]);

        expect(track.id).toBe("explicit");
    });

    it("yields an empty id rather than throwing on an unparsable url", () => {
        const [track] = metingAdapter.parseResponse([
            { name: "No url", artist: "A", url: "not-a-url" },
        ]);

        expect(track.id).toBe("");
    });
});

describe("empty playlist is distinguishable from service failure", () => {
    it("throws EmptyPlaylistError for the upstream 200 + error object", () => {
        expect(() =>
            metingFallbackAdapter.parseResponse({
                error: "unknown playlist id",
            }),
        ).toThrow(EmptyPlaylistError);
    });

    it("throws EmptyPlaylistError for an empty array", () => {
        expect(() => metingAdapter.parseResponse([])).toThrow(
            EmptyPlaylistError,
        );
    });
});

describe("adapter priority", () => {
    it("queries the documented primary API before the fallback", () => {
        const [primary, fallback] = getAdapters();
        const primaryUrl = primary.buildUrl({
            server: "netease",
            type: "playlist",
            id: "1",
        });
        const fallbackUrl = fallback.buildUrl({
            server: "netease",
            type: "playlist",
            id: "1",
        });

        expect(new URL(primaryUrl).hostname).toBe("api.i-meto.com");
        expect(new URL(fallbackUrl).hostname).toBe("api.injahow.cn");
    });
});

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
        const dirtyId = "song&id=1 x";
        const primary = metingAdapter.buildTrackUrl!({
            server: "tencent",
            id: dirtyId,
        });
        const fallback = metingFallbackAdapter.buildTrackUrl!({
            server: "tencent",
            id: dirtyId,
        });

        expect(new URL(primary).searchParams.get("type")).toBe("song");
        expect(new URL(primary).searchParams.get("id")).toBe(dirtyId);
        expect(new URL(fallback).searchParams.get("id")).toBe(dirtyId);
        expect(primary).not.toContain("id=song&id=");
        expect(fallback).not.toContain("id=song&id=");
        expect(fallback.startsWith("https://api.injahow.cn/meting/?")).toBe(
            true,
        );
    });

    it("encodes reserved characters on fallback playlist URLs", () => {
        const url = metingFallbackAdapter.buildUrl({
            server: "netease",
            type: "playlist",
            id: "a&b=c d",
        });
        expect(new URL(url).searchParams.get("id")).toBe("a&b=c d");
        expect(url).not.toContain("id=a&b=c");
    });
});
