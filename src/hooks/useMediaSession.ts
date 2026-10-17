import { useEffect, useRef } from "react";
import {
    MEDIA_SESSION_POSITION_DRIFT_SECONDS,
    MEDIA_SESSION_SEEK_OFFSET_SECONDS,
} from "../constants";
import {
    getSupportedMediaSessionActions,
    isMediaSessionSupported,
    type MediaSessionTrackInfo,
    setMediaSessionActionHandler,
    setMediaSessionMetadata,
    setMediaSessionPlaybackState,
    setMediaSessionPositionState,
    setPlaybackAudioSession,
} from "../utils/mediaSession";

/** 系统媒体控件触发的播放器操作 */
export interface MediaSessionControls {
    play: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
    seek: (time: number) => void;
}

interface UseMediaSessionOptions {
    /** 为 false 时不接管系统媒体控件 */
    enabled: boolean;
    track: MediaSessionTrackInfo | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    controls: MediaSessionControls;
}

/** 当前接管系统媒体控件的实例标识 */
let activeOwner: symbol | null = null;

/**
 * 将播放器接入 Media Session：
 * 曲目信息与封面、播放状态、播放位置，以及播放/暂停/停止/上一首/下一首/跳转/快退/快进操作。
 *
 * 操作处理器只在启用时注册一次，通过 ref 调用最新的控制函数。
 */
export const useMediaSession = ({
    enabled,
    track,
    isPlaying,
    currentTime,
    duration,
    controls,
}: UseMediaSessionOptions): void => {
    const ownerRef = useRef<symbol>(Symbol("media-session-owner"));
    const controlsRef = useRef(controls);
    const currentTimeRef = useRef(currentTime);
    const durationRef = useRef(duration);
    // 最近一次上报的位置，用于推算当前进度
    const reportedRef = useRef<{
        position: number;
        at: number;
        playing: boolean;
    } | null>(null);
    // 最近一次上报位置时的曲目标识
    const reportedTrackRef = useRef<string | null>(null);

    useEffect(() => {
        controlsRef.current = controls;
        currentTimeRef.current = currentTime;
        durationRef.current = duration;
    });

    const active = enabled && track !== null;

    // 注册操作处理器
    useEffect(() => {
        if (!active || !isMediaSessionSupported()) return;
        const owner = ownerRef.current;
        activeOwner = owner;

        const seekBy = (offset: number) => {
            const target = currentTimeRef.current + offset;
            const max = durationRef.current;
            controlsRef.current.seek(
                Math.max(
                    0,
                    Number.isFinite(max) && max > 0
                        ? Math.min(target, max)
                        : target,
                ),
            );
        };

        const handlers: Partial<
            Record<MediaSessionAction, MediaSessionActionHandler>
        > = {
            play: () => controlsRef.current.play(),
            pause: () => controlsRef.current.pause(),
            stop: () => {
                controlsRef.current.pause();
                controlsRef.current.seek(0);
            },
            previoustrack: () => controlsRef.current.prev(),
            nexttrack: () => controlsRef.current.next(),
            seekto: (details) => {
                if (typeof details.seekTime === "number") {
                    controlsRef.current.seek(details.seekTime);
                }
            },
            seekbackward: (details) =>
                seekBy(
                    -(details.seekOffset || MEDIA_SESSION_SEEK_OFFSET_SECONDS),
                ),
            seekforward: (details) =>
                seekBy(details.seekOffset || MEDIA_SESSION_SEEK_OFFSET_SECONDS),
        };

        const actions = getSupportedMediaSessionActions();
        for (const action of actions) {
            setMediaSessionActionHandler(action, handlers[action] ?? null);
        }

        return () => {
            if (activeOwner !== owner) return;
            activeOwner = null;
            for (const action of actions) {
                setMediaSessionActionHandler(action, null);
            }
            setMediaSessionMetadata(null);
            setMediaSessionPositionState(null);
            setMediaSessionPlaybackState("none");
            reportedRef.current = null;
        };
    }, [active]);

    // 曲目信息
    const title = track?.title;
    const artist = track?.artist;
    const album = track?.album;
    const cover = track?.cover;
    useEffect(() => {
        if (!active || title === undefined) return;
        setMediaSessionMetadata({ title, artist, album, cover });
    }, [active, title, artist, album, cover]);

    // 播放状态
    useEffect(() => {
        if (!active) return;
        setMediaSessionPlaybackState(isPlaying ? "playing" : "paused");
        if (isPlaying) setPlaybackAudioSession();
    }, [active, isPlaying]);

    // 曲目、时长或播放状态变化时上报位置
    useEffect(() => {
        if (!active) {
            reportedTrackRef.current = null;
            return;
        }
        // 曲目切换后从 0 开始上报，避免沿用上一首的进度
        const trackKey = `${title ?? ""}\u0000${cover ?? ""}`;
        const trackChanged =
            reportedTrackRef.current !== null &&
            reportedTrackRef.current !== trackKey;
        reportedTrackRef.current = trackKey;
        const position = trackChanged ? 0 : currentTimeRef.current;
        const ok = setMediaSessionPositionState({ duration, position });
        reportedRef.current = ok
            ? { position, at: performance.now(), playing: isPlaying }
            : null;
    }, [active, duration, isPlaying, title, cover]);

    // 进度与推算值偏差较大（跳转、单曲循环重播）时重新上报
    useEffect(() => {
        if (!active) return;
        const reported = reportedRef.current;
        if (!reported) return;
        const elapsed = reported.playing
            ? (performance.now() - reported.at) / 1000
            : 0;
        const expected = reported.position + elapsed;
        if (
            Math.abs(currentTime - expected) <
            MEDIA_SESSION_POSITION_DRIFT_SECONDS
        ) {
            return;
        }
        const ok = setMediaSessionPositionState({
            duration: durationRef.current,
            position: currentTime,
        });
        reportedRef.current = ok
            ? {
                  position: currentTime,
                  at: performance.now(),
                  playing: reported.playing,
              }
            : null;
    }, [active, currentTime]);
};
