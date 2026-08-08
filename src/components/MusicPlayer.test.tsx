import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRACK_FIX_FAILURE_LIMIT } from "../constants";
import type { MusicTrack } from "../hooks/useMusicData";
import { Language } from "../types";
import MusicPlayer from "./MusicPlayer";

type TrackFix = (index: number, currentUrl: string) => Promise<string | null>;

const mocks = vi.hoisted(() => ({
    audioList: [] as MusicTrack[],
    loading: false,
    retryWithNextAdapter: vi.fn(),
    fetchTrackUrl: vi.fn<() => Promise<string | null>>(),
    capturedTrackFix: undefined as TrackFix | undefined,
    capturedTrackPlayable: undefined as (() => void) | undefined,
    capturedEnabled: undefined as boolean | undefined,
}));

vi.mock("../hooks/useMusicData", () => ({
    useMusicData: () => ({
        audioList: mocks.audioList,
        loading: mocks.loading,
        error: null,
        retryWithNextAdapter: mocks.retryWithNextAdapter,
        activeAdapterIndex: 0,
        fetchTrackUrl: mocks.fetchTrackUrl,
    }),
}));

vi.mock("../hooks/useOnlinePlayer", () => ({
    useOnlinePlayer: (
        playlist: { name: string; artist: string; cover: string }[],
        _autoPlay: boolean,
        enabled: boolean,
        onTrackFix?: TrackFix,
        onTrackPlayable?: () => void,
    ) => {
        mocks.capturedTrackFix = onTrackFix;
        mocks.capturedTrackPlayable = onTrackPlayable;
        mocks.capturedEnabled = enabled;
        return {
            currentSong: playlist[0],
            currentIndex: 0,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 0.5,
            playMode: "sequence",
            isLoading: false,
            error: null,
            togglePlay: vi.fn(),
            handleNext: vi.fn(),
            handlePrev: vi.fn(),
            seek: vi.fn(),
            setVolume: vi.fn(),
            toggleMode: vi.fn(),
            playTrack: vi.fn(),
        };
    },
}));

const renderPlayer = () =>
    render(
        <MusicPlayer
            config={{ server: "netease", type: "playlist", id: "1" }}
            language={Language.EN}
        />,
    );

beforeEach(() => {
    mocks.capturedTrackFix = undefined;
    mocks.capturedTrackPlayable = undefined;
    mocks.capturedEnabled = undefined;
    mocks.loading = false;
    mocks.retryWithNextAdapter.mockClear();
    mocks.fetchTrackUrl.mockReset();
});

describe("MusicPlayer adapter downgrade path", () => {
    it("switches adapters even when tracks carry no usable id", async () => {
        // 上游不返回 id 且 url 也无法还原 id 时，单曲回退无从下手；
        // 这曾经让失败计数被跳过，导致整单换源的降级路径永远不触发
        mocks.audioList = [
            {
                id: "",
                name: "No id track",
                artist: "Artist",
                url: "https://example.test/opaque.mp3",
                cover: "",
                lrc: "",
            },
        ];

        renderPlayer();
        expect(mocks.capturedTrackFix).toBeDefined();

        for (let i = 0; i < TRACK_FIX_FAILURE_LIMIT; i += 1) {
            await mocks.capturedTrackFix?.(
                0,
                "https://example.test/opaque.mp3",
            );
        }

        expect(mocks.fetchTrackUrl).not.toHaveBeenCalled();
        expect(mocks.retryWithNextAdapter).toHaveBeenCalledTimes(1);
    });

    it("switches adapters when per-track fallback keeps returning nothing", async () => {
        mocks.audioList = [
            {
                id: "3322640395",
                name: "Track",
                artist: "Artist",
                url: "https://api.injahow.cn/meting/?server=netease&type=url&id=3322640395",
                cover: "",
                lrc: "",
            },
        ];
        mocks.fetchTrackUrl.mockResolvedValue(null);

        renderPlayer();

        for (let i = 0; i < TRACK_FIX_FAILURE_LIMIT; i += 1) {
            await mocks.capturedTrackFix?.(0, "");
        }

        expect(mocks.fetchTrackUrl).toHaveBeenCalled();
        expect(mocks.retryWithNextAdapter).toHaveBeenCalledTimes(1);
    });

    it("does not carry a stale failure across a track that played fine", async () => {
        mocks.audioList = [
            {
                id: "",
                name: "No id track",
                artist: "Artist",
                url: "https://example.test/opaque.mp3",
                cover: "",
                lrc: "",
            },
        ];

        renderPlayer();

        // 偶发的单曲失败：某首歌下架、某个链接坏掉
        await mocks.capturedTrackFix?.(0, "https://example.test/opaque.mp3");

        // 之后有曲目正常播放，说明数据源本身是好的
        mocks.capturedTrackPlayable?.();

        // 很久以后又有一首歌坏了——这不该被算作「连续」失败而整单换源
        await mocks.capturedTrackFix?.(0, "https://example.test/opaque.mp3");

        expect(mocks.retryWithNextAdapter).not.toHaveBeenCalled();
    });

    it("disables the audio player while a playlist refetch is in flight", () => {
        mocks.audioList = [
            {
                id: "1",
                name: "Track",
                artist: "Artist",
                url: "https://example.test/a.mp3",
                cover: "",
                lrc: "",
            },
        ];

        mocks.loading = false;
        const { rerender } = renderPlayer();
        expect(mocks.capturedEnabled).toBe(true);

        // 切换适配器会重新拉取歌单，界面切到 CONNECTING；
        // 播放器必须同时停下，否则会「显示正在连接却仍在放旧数据源」
        mocks.loading = true;
        rerender(
            <MusicPlayer
                config={{ server: "netease", type: "playlist", id: "1" }}
                language={Language.EN}
            />,
        );

        expect(mocks.capturedEnabled).toBe(false);
    });

    it("does not count an out-of-range index as a playback failure", async () => {
        mocks.audioList = [
            {
                id: "1",
                name: "Track",
                artist: "Artist",
                url: "https://example.test/a.mp3",
                cover: "",
                lrc: "",
            },
        ];

        renderPlayer();

        await expect(mocks.capturedTrackFix?.(99, "")).resolves.toBeNull();
        expect(mocks.retryWithNextAdapter).not.toHaveBeenCalled();
    });
});
