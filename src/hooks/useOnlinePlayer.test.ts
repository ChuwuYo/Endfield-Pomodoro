import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../constants";
import { PlayMode } from "../types";
import type { Song } from "./useOnlinePlayer";
import { useOnlinePlayer } from "./useOnlinePlayer";

const makePlaylist = (count: number, prefix: string): Song[] =>
    Array.from({ length: count }, (_, index) => ({
        id: `${prefix}-${index}`,
        name: `${prefix} track ${index}`,
        artist: "Artist",
        url: `https://example.test/${prefix}/${index}.mp3`,
        cover: "",
        lrc: "",
    }));

beforeEach(() => {
    localStorage.clear();
    // 固定为顺序播放，避免随机起始索引干扰断言
    localStorage.setItem(STORAGE_KEYS.AUDIO_PLAY_MODE, PlayMode.SEQUENCE);
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue(
        undefined,
    );
    vi.spyOn(window.HTMLMediaElement.prototype, "load").mockImplementation(
        () => {},
    );
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(
        () => {},
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("useOnlinePlayer playlist shrink", () => {
    it("keeps a playable current song when the list shrinks below the current index", () => {
        const { result, rerender } = renderHook(
            ({ playlist }) => useOnlinePlayer(playlist, false, true),
            { initialProps: { playlist: makePlaylist(86, "long") } },
        );

        act(() => {
            result.current.playTrack(49, true);
        });
        expect(result.current.currentSong?.name).toBe("long track 49");

        // 同一歌单来源下切换 API 适配器：列表变短但组件不会重建
        rerender({ playlist: makePlaylist(10, "short") });

        expect(result.current.currentSong).toBeDefined();
        expect(result.current.currentSong?.url).toBeTruthy();
    });

    it("lands on the nearest valid position instead of jumping back to the start", () => {
        const { result, rerender } = renderHook(
            ({ playlist }) => useOnlinePlayer(playlist, false, true),
            { initialProps: { playlist: makePlaylist(86, "long") } },
        );

        act(() => {
            result.current.playTrack(49, true);
        });

        rerender({ playlist: makePlaylist(10, "short") });

        // 适配器降级不是用户主动换歌单，应尽量少打扰：收敛到最近的合法位置而非回到开头
        expect(result.current.currentIndex).toBe(9);
        expect(result.current.currentSong?.name).toBe("short track 9");
    });

    it("leaves an in-range index untouched when the playlist only changes content", () => {
        const { result, rerender } = renderHook(
            ({ playlist }) => useOnlinePlayer(playlist, false, true),
            { initialProps: { playlist: makePlaylist(86, "long") } },
        );

        act(() => {
            result.current.playTrack(3, true);
        });

        rerender({ playlist: makePlaylist(86, "other") });

        expect(result.current.currentIndex).toBe(3);
        expect(result.current.currentSong?.name).toBe("other track 3");
    });

    it("notifies the caller when a track becomes playable", () => {
        const created: HTMLAudioElement[] = [];
        const OriginalAudio = window.Audio;
        vi.stubGlobal(
            "Audio",
            class extends OriginalAudio {
                constructor(src?: string) {
                    super(src);
                    created.push(this);
                }
            },
        );

        const onTrackPlayable = vi.fn();
        renderHook(() =>
            useOnlinePlayer(
                makePlaylist(3, "list"),
                false,
                true,
                undefined,
                onTrackPlayable,
            ),
        );

        expect(created.length).toBeGreaterThan(0);

        act(() => {
            created[0].dispatchEvent(new Event("canplay"));
        });

        expect(onTrackPlayable).toHaveBeenCalled();
    });

    it("still exposes no song for a genuinely empty playlist", () => {
        const { result } = renderHook(() => useOnlinePlayer([], false, true));

        expect(result.current.currentSong).toBeUndefined();
    });
});
