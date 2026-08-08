import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API_FETCH_DELAY_MS } from "../constants";
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

vi.mock("../utils/musicApiAdapters", () => ({
    getAdapters: () => [
        {
            buildUrl: () => "https://example.test/playlist",
            parseResponse: (data: unknown) => data as MusicTrack[],
        },
    ],
}));

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
});
