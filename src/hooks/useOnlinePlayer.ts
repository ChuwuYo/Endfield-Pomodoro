import { useState, useRef, useEffect, useCallback } from 'react';
import { NEXT_TRACK_RETRY_DELAY_MS, AUDIO_LOADING_TIMEOUT_MS, TIME_UPDATE_THROTTLE_SECONDS } from '../constants';
import { PlayMode } from '../types';

export interface Song {
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
}



export const useOnlinePlayer = (playlist: Song[], autoPlay: boolean = false, enabled: boolean = true) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastTimeRef = useRef(0);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.7);
    const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.SEQUENCE);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);

    // 切歌逻辑
    const handleNext = useCallback((isAuto: boolean = false) => {
        if (playlist.length === 0) return;

        let nextIndex = currentIndex;

        if (playMode === PlayMode.RANDOM) {
            if (playlist.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentIndex);
            }
        } else if (playMode === PlayMode.LOOP && isAuto) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        } else {
            nextIndex = (currentIndex + 1) % playlist.length;
        }

        setCurrentIndex(nextIndex);
        setIsPlaying(true);
    }, [currentIndex, playMode, playlist.length]);

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    // 初始化 Audio 对象（只执行一次）
    useEffect(() => {
        const audio = new Audio();
        // 不在这里设置音量，由专门的音量 effect 处理
        audioRef.current = audio;

        const handleTimeUpdate = () => {
            const time = audio.currentTime;
            if (Math.abs(time - lastTimeRef.current) >= TIME_UPDATE_THROTTLE_SECONDS) {
                lastTimeRef.current = time;
                setCurrentTime(time);
            }
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => handleNextRef.current?.(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setIsLoading(false);
            setError('Load failed');
            setTimeout(() => handleNextRef.current?.(true), NEXT_TRACK_RETRY_DELAY_MS);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('error', handleError);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('error', handleError);

            // 注意：在线播放器的歌曲 URL 来自 Meting API，不是 blob URL，因此不需要清理
            // 保留此注释是为了提醒未来开发者，如果在线播放器开始支持 blob URL，需要添加相应的清理逻辑
        };
    }, []);

    // 监听音量变化（独立effect）
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 当禁用时暂停播放
    useEffect(() => {
        if (!enabled && audioRef.current) {
            audioRef.current.pause();
            queueMicrotask(() => setIsPlaying(false));
        }
    }, [enabled]);

    // 监听播放列表和索引变化
    useEffect(() => {
        const audio = audioRef.current;
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
                        await audio.play();
                    }
                } catch (err) {
                    console.error("Playback failed:", err);
                    setIsPlaying(false);
                }
            };

            loadAndPlay();
        }
    }, [currentIndex, playlist, autoPlay, isPlaying]);

    // 监听播放状态变化
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || playlist.length === 0) return;

        if (isPlaying) {
            if (audio.readyState >= 2) {
                audio.play().catch(err => {
                    console.error("Playback failed:", err);
                    setIsPlaying(false);
                });
            } else {
                // 添加 canplay 监听和超时回退
                const onCanPlay = () => {
                    audio.play().catch(err => {
                        console.error("Playback failed:", err);
                        setIsPlaying(false);
                    });
                };
                audio.addEventListener('canplay', onCanPlay, { once: true });
                
                const timeoutId = setTimeout(() => {
                    if (audioRef.current && audioRef.current.readyState < 2) {
                        console.warn('Audio loading timeout');
                        setIsPlaying(false);
                    }
                }, AUDIO_LOADING_TIMEOUT_MS);

                return () => {
                    clearTimeout(timeoutId);
                    audio.removeEventListener('canplay', onCanPlay);
                };
            }
        } else {
            audio.pause();
        }
    }, [isPlaying, playlist.length]);

    // 播放控制
    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(err => console.error("Playback failed:", err));
            }
        }
    };

    const handlePrev = () => {
        if (playlist.length === 0) return;

        let prevIndex = currentIndex;

        if (playMode === PlayMode.RANDOM) {
            if (playlist.length > 1) {
                do {
                    prevIndex = Math.floor(Math.random() * playlist.length);
                } while (prevIndex === currentIndex);
            }
        } else {
            prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }

        setCurrentIndex(prevIndex);
        setIsPlaying(true);
    };

    // 进度跳转
    const seek = (time: number) => {
        if (audioRef.current) {
            const newTime = Math.max(0, Math.min(time, duration));
            audioRef.current.currentTime = newTime;
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
    const playTrack = (index: number) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentIndex(index);
            setIsPlaying(true);
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
        handleNext: () => handleNext(false), // 手动触发
        handlePrev,
        seek,
        setVolume,
        toggleMode,
        playTrack
    };
};
