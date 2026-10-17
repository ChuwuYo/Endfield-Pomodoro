import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API_FETCH_DELAY_MS } from "../constants";
import { MusicDataError } from "../types";
import type { MusicTrack } from "./useMusicData";
import { useMusicData } from "./useMusicData";

const staleTracks: MusicTrack[] = [
    {
        id: "stale",
        name: "Stale Track",
        artist: "Old",
        url: "https://example.test/stale.mp3",
        cover: "",
        lrc: "",
    },
];

vi.mock("../utils/musicApiAdapters", async () => {
    const actual = await vi.importActual<
        typeof import("../utils/musicApiAdapters")
    >("../utils/musicApiAdapters");
    return {
        ...actual,
        getAdapters: () => [
            {
                buildUrl: () => "https://example.test/primary",
                parseResponse: actual.metingAdapter.parseResponse,
            },
            {
                buildUrl: () => "https://example.test/fallback",
                parseResponse: actual.metingAdapter.parseResponse,
            },
        ],
    };
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("useMusicData", () => {
    it("does not commit tracks when aborted after response resolves but before body", async () => {
        vi.useFakeTimers();

        let resolveJson!: (value: MusicTrack[]) => void;
        const jsonPromise = new Promise<MusicTrack[]>((resolve) => {
            resolveJson = resolve;
        });

        const fetchMock = vi.fn(async () => ({
            ok: true,
            status: 200,
            json: () => jsonPromise,
        }));
        vi.stubGlobal("fetch", fetchMock);

        const { result, unmount } = renderHook(() =>
            useMusicData({
                server: "netease",
                type: "playlist",
                id: "1",
            }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(API_FETCH_DELAY_MS);
        });

        expect(fetchMock).toHaveBeenCalled();
        expect(result.current.audioList).toEqual([]);

        unmount();

        await act(async () => {
            resolveJson(staleTracks);
            await Promise.resolve();
        });

        expect(result.current.audioList).toEqual([]);
    });

    it("reports an invalid playlist separately from a service outage", async () => {
        vi.useFakeTimers();

        // 上游对不存在的歌单同样返回 HTTP 200，内容为错误对象
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                status: 200,
                json: async () => ({ error: "unknown playlist id" }),
            })),
        );

        const { result } = renderHook(() =>
            useMusicData({ server: "netease", type: "playlist", id: "404" }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(API_FETCH_DELAY_MS);
        });

        expect(result.current.error).toBe(MusicDataError.PLAYLIST_UNAVAILABLE);
    });

    it("stays conservative when one source fails and another reports an empty playlist", async () => {
        vi.useFakeTimers();

        let call = 0;
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                call += 1;
                if (call === 1) throw new TypeError("Failed to fetch");
                return {
                    ok: true,
                    status: 200,
                    json: async () => [],
                };
            }),
        );

        const { result } = renderHook(() =>
            useMusicData({ server: "netease", type: "playlist", id: "1" }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(API_FETCH_DELAY_MS);
        });

        expect(result.current.error).toBe(MusicDataError.SERVICE_UNAVAILABLE);
    });

    it("reports a service outage when the request fails at the network layer", async () => {
        vi.useFakeTimers();

        vi.stubGlobal(
            "fetch",
            vi.fn(async () => {
                throw new TypeError("Failed to fetch");
            }),
        );

        const { result } = renderHook(() =>
            useMusicData({ server: "netease", type: "playlist", id: "1" }),
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(API_FETCH_DELAY_MS);
        });

        expect(result.current.error).toBe(MusicDataError.SERVICE_UNAVAILABLE);
    });
});
