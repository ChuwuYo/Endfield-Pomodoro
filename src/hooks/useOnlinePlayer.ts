import { useState, useRef, useEffect, useCallback } from 'react';

export interface Song {
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
}

export const PlayMode = {
    SEQUENCE: 'sequence',
    LOOP: 'loop',
    RANDOM: 'random'
} as const;

export type PlayMode = typeof PlayMode[keyof typeof PlayMode];


export const useOnlinePlayer = (playlist: Song[], autoPlay: boolean = false) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
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
    }, [currentIndex, playlist.length, playMode]);

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    // 初始化 Audio 对象（只执行一次）
    useEffect(() => {
        const audio = new Audio();
        audio.volume = volume;
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => handleNextRef.current?.(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setIsLoading(false);
            setError('加载失败');
            setTimeout(() => handleNextRef.current?.(true), 1000);
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
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 监听音量变化（独立effect）
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

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
                    console.error("播放失败:", err);
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
            audio.play().catch(err => {
                console.error("播放失败:", err);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    }, [isPlaying, playlist.length]);

    // 播放控制
    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(err => console.error("播放失败:", err));
            }
        }
    }, [isPlaying]);

    const handlePrev = useCallback(() => {
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
    }, [currentIndex, playlist.length, playMode]);

    // 进度跳转
    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            const newTime = Math.max(0, Math.min(time, duration));
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }, [duration]);

    // 切换模式
    const toggleMode = useCallback(() => {
        setPlayMode(prev => {
            if (prev === PlayMode.SEQUENCE) return PlayMode.LOOP;
            if (prev === PlayMode.LOOP) return PlayMode.RANDOM;
            return PlayMode.SEQUENCE;
        });
    }, []);

    // 直接播放指定索引
    const playTrack = useCallback((index: number) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentIndex(index);
            setIsPlaying(true);
        }
    }, [playlist.length]);

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
