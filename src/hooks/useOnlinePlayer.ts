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

    // 初始化 Audio 对象
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = volume;

        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => handleNext(true); // 自动播放下一首
        const handleCanPlay = () => setIsLoading(false);
        const handleWaiting = () => setIsLoading(true);
        const handleError = () => {
            setIsLoading(false);
            setError('加载失败');
            // 自动跳过错误歌曲
            setTimeout(() => handleNext(true), 1000);
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
    }, []);

    // 监听播放列表和索引变化
    useEffect(() => {
        if (!audioRef.current || playlist.length === 0) return;

        const currentSong = playlist[currentIndex];
        if (!currentSong?.url) return;

        // 避免重复加载同一首歌
        if (audioRef.current.src !== currentSong.url) {
            setIsLoading(true);
            setError(null);
            audioRef.current.src = currentSong.url;
            audioRef.current.load();

            if (isPlaying || autoPlay) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.error("播放失败:", err);
                        setIsPlaying(false);
                    });
                }
            }
        }
    }, [currentIndex, playlist]);

    // 监听音量变化
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

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

    // 切歌逻辑
    const handleNext = useCallback((isAuto: boolean = false) => {
        if (playlist.length === 0) return;

        let nextIndex = currentIndex;

        if (playMode === PlayMode.RANDOM) {
            // 随机模式：随机选择一个非当前的索引
            if (playlist.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentIndex);
            }
        } else if (playMode === PlayMode.LOOP && isAuto) {
            // 单曲循环且是自动播放结束时：不改变索引，重新播放
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        } else {
            // 顺序模式 或 手动切歌：下一首
            nextIndex = (currentIndex + 1) % playlist.length;
        }

        setCurrentIndex(nextIndex);
        setIsPlaying(true);
    }, [currentIndex, playlist.length, playMode]);

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
