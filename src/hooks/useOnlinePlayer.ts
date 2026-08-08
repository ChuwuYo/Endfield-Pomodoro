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
) => {
    // 音频实例用 ref 持有；Swap 时递增 generation，驱动监听器/加载 effect 重跑
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const getAudio = (): HTMLAudioElement => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
        return audioRef.current;
    };
    const [audioGeneration, setAudioGeneration] = useState(0);

    // 预加载的 Audio 实例引用
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
    const retryTimerRef = useRef<number | null>(null);
    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);
    const consecutiveErrorsRef = useRef(0);
    // 用于标记当前歌曲是否已经尝试过单曲回退
    const trackRetryRef = useRef<{ index: number; id: string; fixed: boolean }>(
        {
            index: -1,
            id: "",
            fixed: false,
        },
    );
    // 保持最新的 currentIndex 引用，解决 handleError 闭包问题
    const currentIndexRef = useRef(currentIndex);

    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // 保持最新的 isPlaying 引用
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    // 使用 Ref 存储最新的 onTrackFix
    const onTrackFixRef = useRef(onTrackFix);

    useEffect(() => {
        onTrackFixRef.current = onTrackFix;
    }, [onTrackFix]);

    // 初始化随机索引逻辑
    const initializedRef = useRef(false);

    useEffect(() => {
        // 如果播放列表为空，重置初始化状态，以便下次加载时能重新执行随机逻辑
        if (playlist.length === 0) {
            initializedRef.current = false;
            return;
        }

        // 当播放列表首次加载且非空时
        if (!initializedRef.current) {
            initializedRef.current = true;
            // 如果是随机模式，则随机选择一首起始歌曲
            if (playMode === PlayMode.RANDOM) {
                const randomIndex = Math.floor(Math.random() * playlist.length);
                // 延迟到微任务中更新，避免在 effect 中同步 setState 触发级联渲染
                queueMicrotask(() => setCurrentIndex(randomIndex));
            }
        }
    }, [playlist.length, playMode]);

    // 使用提取的洗牌逻辑 Hook
    const { getNextRandomIndex, getPrevRandomIndex, peekNextRandomIndex } =
        useShuffle(playlist.length, playMode, currentIndex);

    // 切歌逻辑
    const handleNext = useCallback(
        (isAuto: boolean = false) => {
            // 如果是手动切歌，重置连续错误计数
            if (!isAuto) {
                consecutiveErrorsRef.current = 0;
            }

            if (playlist.length === 0) return;

            let nextIndex: number;

            if (playMode === PlayMode.RANDOM) {
                nextIndex = getNextRandomIndex();
            } else if (playMode === PlayMode.LOOP && isAuto) {
                // 单曲循环模式下自动切歌（播放结束），只需重置进度
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
            // 不调用 setIsPlaying，保持当前播放状态
        },
        [currentIndex, playMode, playlist.length, getNextRandomIndex],
    );

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    // 初始化 Audio 对象事件监听 (当 audioGeneration 变化时重新绑定)
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
            setError(null); // Clear error on success
            consecutiveErrorsRef.current = 0; // 重置连续错误计数
            if (retryTimerRef.current !== null) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setIsLoading(false);
            console.error("Online playback error: Load failed");

            const currentOnTrackFix = onTrackFixRef.current;
            const currentIsPlaying = isPlayingRef.current;

            // 单曲级回退逻辑
            if (currentOnTrackFix) {
                const currentIdx = currentIndexRef.current;
                const currentTrackId = playlist[currentIdx]?.id || "";

                // 如果是新的一首歌(索引或ID变化)，或者虽然是同一首但还没尝试修复过
                if (
                    trackRetryRef.current.index !== currentIdx ||
                    trackRetryRef.current.id !== currentTrackId ||
                    !trackRetryRef.current.fixed
                ) {
                    // 尝试修复时，暂时清除错误状态，避免触发上层整单回退
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
                                // URL 覆盖将通过播放列表状态传播
                                // 但为了立即生效，直接应用到当前 audio 实例
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
                                // 如果之前是播放状态，尝试恢复播放
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
                                // 修复失败，继续走原有错误流程
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

        const proceedToErrorHandling = () => {
            setError("Load failed"); // Set error state only when we give up or skip
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
                if (isMounted) {
                    handleNextRef.current?.(true);
                }
                retryTimerRef.current = null;
            }, NEXT_TRACK_RETRY_DELAY_MS);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("error", handleError);

        // 确保应用当前音量
        audio.volume = volume;

        // 初始化状态同步（针对已加载的音频实例）
        if (audio.readyState >= 1) {
            // HAVE_METADATA
            setDuration(audio.duration);
        }
        if (audio.readyState >= 3) {
            // HAVE_FUTURE_DATA
            setIsLoading(false);
        }

        return () => {
            isMounted = false;
            audio.pause();
            if (retryTimerRef.current !== null) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
            // 注意：这里不要清空 src，因为如果这是被交换出去的 audio，它可能马上要被用作 preload
            // 或者如果这是 preload 进来的 audio，我们也不希望清空它
            // 只有当组件卸载或者真正销毁时才需要清理，但 React Effect cleanup 在依赖变化时也会运行。
            // 简单 pause 和移除监听器即可。

            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("canplay", handleCanPlay);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("error", handleError);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- volume 的变化由单独的 effect 处理，以避免每次音量变化都重新绑定所有事件监听器
    }, [audioGeneration]);

    // 监听音量变化
    useEffect(() => {
        getAudio().volume = volume;
    }, [volume, audioGeneration]);

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

    // 当禁用时暂停播放
    useEffect(() => {
        if (!enabled) {
            getAudio().pause();
            queueMicrotask(() => setIsPlaying(false));
        }
    }, [enabled, audioGeneration]);

    // 预加载下一首（延迟执行以优化性能）
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
                // Create or reuse audio element
                if (!preloadAudioRef.current) {
                    preloadAudioRef.current = new Audio();
                }
                const preloadAudio = preloadAudioRef.current;

                // Only load if URL is different
                if (preloadAudio.src !== nextSong.url) {
                    preloadAudio.src = nextSong.url;
                    preloadAudio.preload = "auto";
                    preloadAudio.load();
                }

                // Preload cover image
                if (nextSong.cover) {
                    const img = new Image();
                    img.src = nextSong.cover;
                }
            }
        }, PRELOAD_DELAY_MS);

        return () => clearTimeout(timerId);
    }, [currentIndex, playlist, playMode, peekNextRandomIndex]);

    // 组件卸载时清理资源
    useEffect(() => {
        return () => {
            // 清理预加载的音频实例
            if (preloadAudioRef.current) {
                preloadAudioRef.current.pause();
                preloadAudioRef.current.src = "";
                preloadAudioRef.current = null;
            }
        };
    }, []);

    // 监听播放列表和索引变化 - 加载当前音频（含无缝切换逻辑）
    useEffect(() => {
        const audio = getAudio();
        if (!audio || playlist.length === 0) return;

        const currentSong = playlist[currentIndex];
        if (!currentSong?.url) return;

        // 检查是否命中预加载 (无缝切换核心逻辑)
        if (
            preloadAudioRef.current &&
            preloadAudioRef.current.src === currentSong.url
        ) {
            const newMain = preloadAudioRef.current;
            const oldMain = getAudio();

            // 交换实例：新实例进 ref，旧实例回收为 preload；bump generation 重绑监听
            audioRef.current = newMain;
            preloadAudioRef.current = oldMain;
            setAudioGeneration((g) => g + 1);

            // return 后 generation 更新会触发本 effect 再跑；此时 audioRef 已是 newMain
            // 且 newMain.src === currentSong.url，会进入下方的 play 逻辑
            return;
        }

        // 普通加载逻辑 (未命中预加载或无需交换)
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
                    // 只有在非 AbortError 时才重置播放状态
                    // 这样可以避免网络慢或快速切换时 UI 闪烁回暂停
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
            // 如果 src 相同 (例如刚刚完成了 Swap，或者重复点击同一首)
            // 确保如果应该是播放状态，则进行播放
            if (isPlaying && audio.paused) {
                audio.play().catch((err) => {
                    console.error("Playback failed (swap resume):", err);
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
    }, [currentIndex, playlist, autoPlay, isPlaying, audioGeneration]);

    // 监听播放状态变化 (Play/Pause 控制)
    useEffect(() => {
        const audio = getAudio();
        if (!audio || playlist.length === 0) return;

        if (isPlaying) {
            if (audio.paused) {
                if (audio.readyState >= 2) {
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
                        if (getAudio().readyState < 2) {
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
    }, [isPlaying, playlist.length, audioGeneration]);

    // 播放控制
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
                        // 忽略 AbortError
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

    // 上一曲
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

    // 进度跳转
    const seek = (time: number) => {
        const audio = getAudio();
        if (audio) {
            const newTime = Math.max(0, Math.min(time, duration));
            audio.currentTime = newTime;
            lastTimeRef.current = newTime;
            setCurrentTime(newTime);
        }
    };

    // 切换模式
    const toggleMode = () => {
        setPlayMode((prev) => {
            if (prev === PlayMode.SEQUENCE) return PlayMode.LOOP;
            if (prev === PlayMode.LOOP) return PlayMode.RANDOM;
            return PlayMode.SEQUENCE;
        });
    };

    // 直接播放指定索引
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
        handleNext: () => handleNext(false),
        handlePrev,
        seek,
        setVolume,
        toggleMode,
        playTrack,
    };
};
