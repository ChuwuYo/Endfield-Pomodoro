import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MUSIC_VOLUME } from "../config/musicConfig";
import {
    AUDIO_LOADING_TIMEOUT_MS,
    NEXT_TRACK_RETRY_DELAY_MS,
    ONLINE_CONSECUTIVE_ERROR_LIMIT,
    PRELOAD_DELAY_MS,
    RESUME_TIME_BUFFER_SECONDS,
    STORAGE_KEYS,
    TIME_UPDATE_THROTTLE_SECONDS,
} from "../constants";
import { PlayMode } from "../types";
import { useRetryOnReconnect } from "./useRetryOnReconnect";
import { useShuffle } from "./useShuffle";

export interface Song {
    id?: string;
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
}

export const useOnlinePlayer = (
    playlist: Song[],
    autoPlay: boolean = false,
    enabled: boolean = true,
    onTrackFix?: (index: number, currentUrl: string) => Promise<string | null>,
    onTrackPlayable?: () => void,
) => {
    // 主音频实例：整个生命周期复用同一个元素，切歌时只替换 src
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const getAudio = (): HTMLAudioElement => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        return audioRef.current;
    };

    const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

    const lastTimeRef = useRef(0);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_VOLUME);
            const parsed = stored ? Number(stored) : NaN;
            return Number.isFinite(parsed)
                ? Math.min(1, Math.max(0, parsed))
                : DEFAULT_MUSIC_VOLUME;
        } catch (error) {
            console.error(
                "Failed to read audio volume from localStorage",
                error,
            );
            return DEFAULT_MUSIC_VOLUME;
        }
    });
    const [playMode, setPlayMode] = useState<PlayMode>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_PLAY_MODE);
            if (
                stored === PlayMode.SEQUENCE ||
                stored === PlayMode.LOOP ||
                stored === PlayMode.RANDOM
            ) {
                return stored;
            }
            return PlayMode.RANDOM;
        } catch (error) {
            console.error(
                "Failed to read audio play mode from localStorage",
                error,
            );
            return PlayMode.RANDOM;
        }
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [awaitingNetworkUrl, setAwaitingNetworkUrl] = useState<string | null>(
        null,
    );
    const retryTimerRef = useRef<number | null>(null);
    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);
    const consecutiveErrorsRef = useRef(0);
    const trackRetryRef = useRef<{ index: number; id: string; fixed: boolean }>(
        {
            index: -1,
            id: "",
            fixed: false,
        },
    );
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    const playlistRef = useRef(playlist);
    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);

    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const onTrackFixRef = useRef(onTrackFix);

    useEffect(() => {
        onTrackFixRef.current = onTrackFix;
    }, [onTrackFix]);

    const onTrackPlayableRef = useRef(onTrackPlayable);

    useEffect(() => {
        onTrackPlayableRef.current = onTrackPlayable;
    }, [onTrackPlayable]);

    const initializedRef = useRef(false);

    useEffect(() => {
        if (playlist.length === 0) {
            initializedRef.current = false;
            return;
        }

        if (!initializedRef.current) {
            initializedRef.current = true;
            if (playMode === PlayMode.RANDOM) {
                const randomIndex = Math.floor(Math.random() * playlist.length);
                queueMicrotask(() => setCurrentIndex(randomIndex));
            }
        }
    }, [playlist.length, playMode]);

    if (playlist.length > 0 && currentIndex > playlist.length - 1) {
        setCurrentIndex(playlist.length - 1);
    }

    const { getNextRandomIndex, getPrevRandomIndex, peekNextRandomIndex } =
        useShuffle(playlist.length, playMode, currentIndex);

    const handleNext = useCallback(
        (isAuto: boolean = false) => {
            if (!isAuto) {
                consecutiveErrorsRef.current = 0;
            }

            if (playlist.length === 0) return;

            let nextIndex: number;

            if (playMode === PlayMode.RANDOM) {
                nextIndex = getNextRandomIndex();
            } else if (playMode === PlayMode.LOOP && isAuto) {
                const audio = getAudio();
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(console.error);
                }
                return;
            } else {
                nextIndex = (currentIndex + 1) % playlist.length;
            }

            setCurrentIndex(nextIndex);
        },
        [currentIndex, playMode, playlist.length, getNextRandomIndex],
    );

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    useEffect(() => {
        const audio = getAudio();
        let isMounted = true;

        const handleTimeUpdate = () => {
            const time = audio.currentTime;
            if (
                Math.abs(time - lastTimeRef.current) >=
                TIME_UPDATE_THROTTLE_SECONDS
            ) {
                lastTimeRef.current = time;
                setCurrentTime(time);
            }
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => handleNextRef.current?.(true);
        const handleCanPlay = () => {
            setIsLoading(false);
            setError(null);
            consecutiveErrorsRef.current = 0;
            onTrackPlayableRef.current?.();
            if (retryTimerRef.current !== null) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
        const handleWaiting = () => setIsLoading(true);
        // 系统或浏览器暂停/恢复（耳机断开、来电、其他应用占用音频）时同步状态；切歌和播放结束时忽略
        const handlePause = () => {
            if (
                audio.ended ||
                audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
                return;
            }
            setIsPlaying(false);
        };
        const handlePlay = () => setIsPlaying(true);
        const handleError = () => {
            // 中止（MEDIA_ERR_ABORTED = 1，切换 src 时出现）或无错误码的事件不视为加载失败
            const errorCode = audio.error?.code ?? 0;
            if (errorCode === 0 || errorCode === 1) {
                return;
            }
            setIsLoading(false);
            console.error("Online playback error: Load failed");

            if (holdForNetwork()) return;

            const currentOnTrackFix = onTrackFixRef.current;
            const currentIsPlaying = isPlayingRef.current;

            if (currentOnTrackFix) {
                const currentIdx = currentIndexRef.current;
                const currentTrackId =
                    playlistRef.current[currentIdx]?.id || "";

                if (
                    trackRetryRef.current.index !== currentIdx ||
                    trackRetryRef.current.id !== currentTrackId ||
                    !trackRetryRef.current.fixed
                ) {
                    setError(null);
                    trackRetryRef.current = {
                        index: currentIdx,
                        id: currentTrackId,
                        fixed: true,
                    };

                    currentOnTrackFix(currentIdx, audio.src)
                        .then((newUrl) => {
                            if (!isMounted) return;
                            if (newUrl) {
                                audio.src = newUrl;
                                audio.load();
                                const resume = Math.max(
                                    0,
                                    lastTimeRef.current -
                                        RESUME_TIME_BUFFER_SECONDS,
                                );
                                try {
                                    audio.currentTime = resume;
                                } catch {
                                    void 0;
                                }
                                if (currentIsPlaying) {
                                    audio.play().catch((e) => {
                                        console.warn(
                                            "Auto-play on track fix failed:",
                                            e,
                                        );
                                    });
                                }
                                return;
                            } else {
                                proceedToErrorHandling();
                            }
                        })
                        .catch(() => {
                            if (isMounted) proceedToErrorHandling();
                        });
                    return;
                }
            }

            proceedToErrorHandling();
        };

        const holdForNetwork = (): boolean => {
            if (navigator.onLine !== false) return false;
            if (retryTimerRef.current !== null) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            setAwaitingNetworkUrl(audio.src);
            return true;
        };

        const proceedToErrorHandling = () => {
            if (holdForNetwork()) return;
            setError("Load failed");
            consecutiveErrorsRef.current += 1;
            if (
                consecutiveErrorsRef.current >= ONLINE_CONSECUTIVE_ERROR_LIMIT
            ) {
                console.error(
                    "Too many consecutive errors, stopping playback.",
                );
                if (retryTimerRef.current !== null) {
                    clearTimeout(retryTimerRef.current);
                    retryTimerRef.current = null;
                }
                setIsPlaying(false);
                return;
            }

            if (retryTimerRef.current !== null) {
                clearTimeout(retryTimerRef.current);
            }
            retryTimerRef.current = window.setTimeout(() => {
                retryTimerRef.current = null;
                if (!isMounted || holdForNetwork()) return;
                handleNextRef.current?.(true);
            }, NEXT_TRACK_RETRY_DELAY_MS);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("error", handleError);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("play", handlePlay);

        audio.volume = volume;

        if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
            setDuration(audio.duration);
        }
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("play", handlePlay);
            audio.pause();
            if (retryTimerRef.current !== null) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }

            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("error", handleError);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- volume 的变化由单独的 effect 处理，以避免每次音量变化都重新绑定所有事件监听器
    }, []);

    useEffect(() => {
        getAudio().volume = volume;
    }, [volume]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIO_VOLUME, String(volume));
        } catch (error) {
            console.error("Failed to persist audio volume", error);
        }
    }, [volume]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIO_PLAY_MODE, playMode);
        } catch (error) {
            console.error("Failed to persist audio play mode", error);
        }
    }, [playMode]);

    useEffect(() => {
        if (!enabled) {
            getAudio().pause();
            queueMicrotask(() => setIsPlaying(false));
        }
    }, [enabled]);

    useEffect(() => {
        if (playlist.length <= 1) return;

        const timerId = setTimeout(() => {
            const nextIndex =
                playMode === PlayMode.RANDOM
                    ? // 使用 peek 获取下一首随机索引，不改变洗牌状态
                      peekNextRandomIndex()
                    : (currentIndex + 1) % playlist.length;

            if (nextIndex === -1) return;

            const nextSong = playlist[nextIndex];
            if (nextSong?.url) {
                if (!preloadAudioRef.current) {
                    preloadAudioRef.current = new Audio();
                }
                const preloadAudio = preloadAudioRef.current;

                if (preloadAudio.src !== nextSong.url) {
                    preloadAudio.src = nextSong.url;
                    preloadAudio.preload = "auto";
                    preloadAudio.load();
                }

                if (nextSong.cover) {
                    const img = new Image();
                    img.src = nextSong.cover;
                }
            }
        }, PRELOAD_DELAY_MS);

        return () => clearTimeout(timerId);
    }, [currentIndex, playlist, playMode, peekNextRandomIndex]);

    useEffect(() => {
        return () => {
            if (preloadAudioRef.current) {
                preloadAudioRef.current.pause();
                preloadAudioRef.current.removeAttribute("src");
                preloadAudioRef.current.load();
                preloadAudioRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const audio = getAudio();
        if (!audio || playlist.length === 0) return;

        const currentSong = playlist[currentIndex];
        if (!currentSong?.url) return;

        if (audio.src !== currentSong.url) {
            const wasPlaying = isPlaying;

            audio.src = currentSong.url;

            const loadAndPlay = async () => {
                try {
                    setIsLoading(true);
                    setError(null);
                    audio.load();

                    if (wasPlaying || autoPlay) {
                        try {
                            await audio.play();
                        } catch (err) {
                            // 忽略 AbortError (快速切歌时发生)
                            if (
                                err instanceof DOMException &&
                                err.name === "AbortError"
                            ) {
                                return;
                            }
                            throw err;
                        }
                    }
                } catch (err) {
                    console.error("Playback failed:", err);
                    if (
                        !(
                            err instanceof DOMException &&
                            err.name === "AbortError"
                        )
                    ) {
                        setIsPlaying(false);
                    }
                }
            };

            loadAndPlay();
        } else {
            if (isPlaying && audio.paused) {
                audio.play().catch((err) => {
                    console.error("Playback failed (resume):", err);
                    if (
                        err instanceof DOMException &&
                        (err.name === "AbortError" ||
                            err.name === "NotSupportedError")
                    ) {
                        return;
                    }
                    setIsPlaying(false);
                });
            }
        }
    }, [currentIndex, playlist, autoPlay, isPlaying]);

    useEffect(() => {
        const audio = getAudio();
        if (!audio || playlist.length === 0) return;

        if (isPlaying) {
            if (audio.paused) {
                if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    audio.play().catch((err) => {
                        console.error("Playback failed:", err);
                        setIsPlaying(false);
                    });
                } else {
                    const onCanPlay = () => {
                        audio.play().catch((err) => {
                            console.error("Playback failed:", err);
                            setIsPlaying(false);
                        });
                    };
                    audio.addEventListener("canplay", onCanPlay, {
                        once: true,
                    });

                    const timeoutId = setTimeout(() => {
                        if (
                            getAudio().readyState <
                            HTMLMediaElement.HAVE_CURRENT_DATA
                        ) {
                            console.warn("Audio loading timeout");
                            setIsPlaying(false);
                        }
                    }, AUDIO_LOADING_TIMEOUT_MS);

                    return () => {
                        clearTimeout(timeoutId);
                        audio.removeEventListener("canplay", onCanPlay);
                    };
                }
            }
        } else {
            if (!audio.paused) {
                audio.pause();
            }
        }
    }, [isPlaying, playlist.length]);

    const togglePlay = () => {
        const audio = getAudio();
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch((err) => {
                        if (
                            err instanceof DOMException &&
                            err.name === "AbortError"
                        ) {
                            return;
                        }
                        console.error("Playback failed:", err);
                        setIsPlaying(false);
                    });
            }
        }
    };

    const play = () => {
        const audio = getAudio();
        if (playlist.length === 0) return;
        audio
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                console.error("Playback failed:", err);
                setIsPlaying(false);
            });
    };

    const pause = () => {
        getAudio().pause();
        setIsPlaying(false);
    };

    const rawCurrentUrl = playlist[currentIndex]?.url;
    let currentUrl: string | undefined;
    try {
        currentUrl = rawCurrentUrl
            ? new URL(rawCurrentUrl, window.location.href).href
            : undefined;
    } catch {
        currentUrl = rawCurrentUrl;
    }
    const reloadAfterReconnect = () => {
        setAwaitingNetworkUrl(null);
        const audio = getAudio();
        if (!audio.src || audio.src !== awaitingNetworkUrl) return;
        const resume = Math.max(
            0,
            lastTimeRef.current - RESUME_TIME_BUFFER_SECONDS,
        );
        setIsLoading(true);
        audio.load();
        try {
            audio.currentTime = resume;
        } catch {
            void 0;
        }
        if (isPlayingRef.current) {
            audio.play().catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") {
                    return;
                }
                console.warn("Auto-play after reconnect failed:", err);
            });
        }
    };

    useRetryOnReconnect(
        awaitingNetworkUrl !== null && awaitingNetworkUrl === currentUrl,
        reloadAfterReconnect,
    );

    const handlePrev = useCallback(() => {
        if (playlist.length === 0) return;

        if (playMode === PlayMode.LOOP) {
            const audio = getAudio();
            if (audio) {
                audio.currentTime = 0;
                if (isPlaying) {
                    audio.play();
                }
            }
            return;
        }

        let prevIndex: number;

        if (playMode === PlayMode.RANDOM) {
            prevIndex = getPrevRandomIndex();
        } else {
            prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }

        setCurrentIndex(prevIndex);
    }, [
        currentIndex,
        playMode,
        playlist.length,
        getPrevRandomIndex,
        isPlaying,
    ]);

    const seek = (time: number) => {
        const audio = getAudio();
        if (audio) {
            const newTime = Math.max(0, Math.min(time, duration));
            audio.currentTime = newTime;
            lastTimeRef.current = newTime;
            setCurrentTime(newTime);
        }
    };

    const toggleMode = () => {
        setPlayMode((prev) => {
            if (prev === PlayMode.SEQUENCE) return PlayMode.LOOP;
            if (prev === PlayMode.LOOP) return PlayMode.RANDOM;
            return PlayMode.SEQUENCE;
        });
    };

    const playTrack = (index: number, keepPlayState: boolean = false) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentIndex(index);
            if (!keepPlayState) {
                setIsPlaying(true);
            }
        }
    };

    return {
        currentSong: playlist[currentIndex],
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playMode,
        isLoading,
        error,
        togglePlay,
        play,
        pause,
        handleNext: () => handleNext(false),
        handlePrev,
        seek,
        setVolume,
        toggleMode,
        playTrack,
    };
};
