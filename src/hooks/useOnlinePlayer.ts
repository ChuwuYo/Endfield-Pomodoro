import { useState, useRef, useEffect, useCallback } from 'react';
import { NEXT_TRACK_RETRY_DELAY_MS, AUDIO_LOADING_TIMEOUT_MS, TIME_UPDATE_THROTTLE_SECONDS, STORAGE_KEYS, PRELOAD_DELAY_MS } from '../constants';
import { PlayMode } from '../types';
import { DEFAULT_MUSIC_VOLUME } from '../config/musicConfig';
import { useShuffle } from './useShuffle';

export interface Song {
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
}

export const useOnlinePlayer = (playlist: Song[], autoPlay: boolean = false, enabled: boolean = true) => {
    // 使用 State 管理当前的 Audio 实例，以便在实例切换（Swap）时触发重渲染
    const [audioInstance, setAudioInstance] = useState<HTMLAudioElement>(() => new Audio());
    
    // 预加载的 Audio 实例引用
    const preloadAudioRef = useRef<HTMLAudioElement | null>(null);

    const lastTimeRef = useRef(0);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_VOLUME);
        const parsed = stored ? Number(stored) : NaN;
        return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_MUSIC_VOLUME;
    });
    const [playMode, setPlayMode] = useState<PlayMode>(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.AUDIO_PLAY_MODE);
        if (stored === PlayMode.SEQUENCE || stored === PlayMode.LOOP || stored === PlayMode.RANDOM) {
            return stored;
        }
        return PlayMode.RANDOM;
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);
    const consecutiveErrorsRef = useRef(0);

    // 使用提取的洗牌逻辑 Hook
    const { getNextRandomIndex, getPrevRandomIndex, peekNextRandomIndex } = useShuffle(playlist.length, playMode, currentIndex);

    // 切歌逻辑
    const handleNext = useCallback((isAuto: boolean = false) => {
        // 如果是手动切歌，重置连续错误计数
        if (!isAuto) {
            consecutiveErrorsRef.current = 0;
        }

        if (playlist.length === 0) return;

        let nextIndex = currentIndex;

        if (playMode === PlayMode.RANDOM) {
            nextIndex = getNextRandomIndex();
        } else if (playMode === PlayMode.LOOP && isAuto) {
            // 单曲循环模式下自动切歌（播放结束），只需重置进度
            if (audioInstance) {
                audioInstance.currentTime = 0;
                audioInstance.play().catch(console.error);
            }
            return;
        } else {
            nextIndex = (currentIndex + 1) % playlist.length;
        }

        setCurrentIndex(nextIndex);
        // 不调用 setIsPlaying，保持当前播放状态
    }, [currentIndex, playMode, playlist.length, getNextRandomIndex, audioInstance]);


    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    // 初始化 Audio 对象事件监听 (当 audioInstance 变化时重新绑定)
    useEffect(() => {
        const audio = audioInstance;
        
        const handleTimeUpdate = () => {
            const time = audio.currentTime;
            if (Math.abs(time - lastTimeRef.current) >= TIME_UPDATE_THROTTLE_SECONDS) {
                lastTimeRef.current = time;
                setCurrentTime(time);
            }
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => handleNextRef.current?.(true);
        const handleCanPlay = () => {
            setIsLoading(false);
            consecutiveErrorsRef.current = 0; // 重置连续错误计数
        };
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setIsLoading(false);
            setError('Load failed');
            
            consecutiveErrorsRef.current += 1;
            if (consecutiveErrorsRef.current >= 5) {
                console.error('Too many consecutive errors, stopping playback.');
                setIsPlaying(false);
                return;
            }

            setTimeout(() => handleNextRef.current?.(true), NEXT_TRACK_RETRY_DELAY_MS);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('error', handleError);

        // 确保应用当前音量
        audio.volume = volume;

        // 初始化状态同步（针对已加载的音频实例）
        if (audio.readyState >= 1) { // HAVE_METADATA
            setDuration(audio.duration);
        }
        if (audio.readyState >= 3) { // HAVE_FUTURE_DATA
            setIsLoading(false);
        }

        return () => {
            audio.pause();
            // 注意：这里不要清空 src，因为如果这是被交换出去的 audio，它可能马上要被用作 preload
            // 或者如果这是 preload 进来的 audio，我们也不希望清空它
            // 只有当组件卸载或者真正销毁时才需要清理，但 React Effect cleanup 在依赖变化时也会运行。
            // 简单 pause 和移除监听器即可。
            
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('error', handleError);
        };
    }, [audioInstance]); // 依赖 audioInstance，切换实例时自动重绑

    // 监听音量变化
    useEffect(() => {
        if (audioInstance) {
            audioInstance.volume = volume;
        }
    }, [volume, audioInstance]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIO_VOLUME, String(volume));
        } catch (error) {
            console.error('Failed to persist audio volume', error);
        }
    }, [volume]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.AUDIO_PLAY_MODE, playMode);
        } catch (error) {
            console.error('Failed to persist audio play mode', error);
        }
    }, [playMode]);

    // 当禁用时暂停播放
    useEffect(() => {
        if (!enabled && audioInstance) {
            audioInstance.pause();
            queueMicrotask(() => setIsPlaying(false));
        }
    }, [enabled, audioInstance]);

    // 监听播放列表变化，处理初始随机播放
    // 使用 ref 记录是否已初始化
    const initializedRef = useRef(false);
    
    useEffect(() => {
        if (playlist.length === 0) {
            initializedRef.current = false;
        } else if (playlist.length > 0 && playMode === PlayMode.RANDOM) {
            // 如果还没初始化，或者模式切换到了 RANDOM，则尝试随机开始
            if (!initializedRef.current) {
                initializedRef.current = true;
                const randomIndex = Math.floor(Math.random() * playlist.length);
                setCurrentIndex(randomIndex);
            }
        } else {
            // 非 RANDOM 模式或已初始化，标记为已初始化
            if (playlist.length > 0) {
                initializedRef.current = true;
            }
        }
    }, [playlist, playMode]);

    // 预加载下一首（延迟执行以优化性能）
    useEffect(() => {
        if (playlist.length <= 1) return;

        const timerId = setTimeout(() => {
            let nextIndex = -1;

            if (playMode === PlayMode.RANDOM) {
                // 使用 peek 获取下一首随机索引，不改变洗牌状态
                nextIndex = peekNextRandomIndex();
            } else {
                nextIndex = (currentIndex + 1) % playlist.length;
            }
            
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
                    console.log(`Preloading next track: ${nextSong.name}`);
                    preloadAudio.src = nextSong.url;
                    preloadAudio.preload = 'auto';
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
                preloadAudioRef.current.src = '';
                preloadAudioRef.current = null;
            }
        };
    }, []);

    // 监听播放列表和索引变化 - 加载当前音频（含无缝切换逻辑）
    useEffect(() => {
        const audio = audioInstance;
        if (!audio || playlist.length === 0) return;

        const currentSong = playlist[currentIndex];
        if (!currentSong?.url) return;

        // 检查是否命中预加载 (无缝切换核心逻辑)
        if (preloadAudioRef.current && preloadAudioRef.current.src === currentSong.url) {
            console.log('Instant play: Swapping audio instance');
            const newMain = preloadAudioRef.current;
            const oldMain = audioInstance;

            // 交换实例
            // 1. 设置新实例为 State (触发重渲染)
            setAudioInstance(newMain);
            // 2. 将旧实例回收给预加载 Ref
            preloadAudioRef.current = oldMain;
            
            // 注意：这里 return 后，State 更新会触发组件重渲染
            // 下一次 render 时，effect 会再次运行，但此时 audioInstance 已经是 newMain
            // 且 newMain.src 已经等于 currentSong.url，所以会进入下方的 play 逻辑
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
                            if (err instanceof DOMException && err.name === 'AbortError') {
                                console.log("Playback aborted (rapid switching)");
                                return;
                            }
                            throw err;
                        }
                    }
                } catch (err) {
                    console.error("Playback failed:", err);
                    // 只有在非 AbortError 时才重置播放状态
                    // 这样可以避免网络慢或快速切换时 UI 闪烁回暂停
                    if (!(err instanceof DOMException && err.name === 'AbortError')) {
                        setIsPlaying(false);
                    }
                }
            };

            loadAndPlay();
        } else {
            // 如果 src 相同 (例如刚刚完成了 Swap，或者重复点击同一首)
            // 确保如果应该是播放状态，则进行播放
            if (isPlaying && audio.paused) {
                 audio.play().catch(err => {
                    console.error("Playback failed (swap resume):", err);
                    setIsPlaying(false);
                 });
            }
        }
    }, [currentIndex, playlist, autoPlay, isPlaying, audioInstance]);

    // 监听播放状态变化 (Play/Pause 控制)
    useEffect(() => {
        const audio = audioInstance;
        if (!audio || playlist.length === 0) return;

        if (isPlaying) {
            if (audio.paused) {
                if (audio.readyState >= 2) {
                    audio.play().catch(err => {
                        console.error("Playback failed:", err);
                        setIsPlaying(false);
                    });
                } else {
                    const onCanPlay = () => {
                        audio.play().catch(err => {
                            console.error("Playback failed:", err);
                            setIsPlaying(false);
                        });
                    };
                    audio.addEventListener('canplay', onCanPlay, { once: true });
                    
                    const timeoutId = setTimeout(() => {
                        if (audioInstance && audioInstance.readyState < 2) {
                            console.warn('Audio loading timeout');
                            setIsPlaying(false);
                        }
                    }, AUDIO_LOADING_TIMEOUT_MS);

                    return () => {
                        clearTimeout(timeoutId);
                        audio.removeEventListener('canplay', onCanPlay);
                    };
                }
            }
        } else {
            if (!audio.paused) {
                audio.pause();
            }
        }
    }, [isPlaying, playlist.length, audioInstance]);

    // 播放控制
    const togglePlay = () => {
        if (!audioInstance) return;

        if (isPlaying) {
            audioInstance.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioInstance.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(err => {
                        // 忽略 AbortError
                        if (err instanceof DOMException && err.name === 'AbortError') {
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
            if (audioInstance) {
                audioInstance.currentTime = 0;
                if (isPlaying) {
                    audioInstance.play();
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
    }, [currentIndex, playMode, playlist.length, getPrevRandomIndex, isPlaying, audioInstance]);

    // 进度跳转
    const seek = (time: number) => {
        if (audioInstance) {
            const newTime = Math.max(0, Math.min(time, duration));
            audioInstance.currentTime = newTime;
            lastTimeRef.current = newTime;
            setCurrentTime(newTime);
        }
    };

    // 切换模式
    const toggleMode = () => {
        setPlayMode(prev => {
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
        playTrack
    };
};
