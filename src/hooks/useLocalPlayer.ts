import { useState, useRef, useEffect, useCallback } from 'react';
import { parseBlob } from 'music-metadata';

export interface LocalTrack {
    file: File;
    name: string;
    artist?: string;
    blobUrl: string;
    coverUrl?: string;
}

export const PlayMode = {
    SEQUENCE: 'sequence',
    LOOP: 'loop',
    RANDOM: 'random'
} as const;

export type PlayMode = typeof PlayMode[keyof typeof PlayMode];

export const useLocalPlayer = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playlist, setPlaylist] = useState<LocalTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0.5);
    const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.SEQUENCE);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // 用 ref 保存 handleNext 以避免闭包问题
    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);

    // 切歌逻辑
    const handleNext = useCallback((isAuto: boolean = false) => {
        if (playlist.length === 0) return;

        if (playMode === PlayMode.LOOP && isAuto) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        let nextIndex: number;
        if (playMode === PlayMode.RANDOM) {
            if (playlist.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentIndex);
            } else {
                nextIndex = 0;
            }
        } else {
            nextIndex = (currentIndex + 1) % playlist.length;
        }

        setCurrentIndex(nextIndex);
        setIsPlaying(true);
    }, [playlist.length, playMode, currentIndex]);

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    // 初始化 Audio 对象（只执行一次）
    useEffect(() => {
        const audio = new Audio();
        audio.volume = volume;
        audioRef.current = audio;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const onEnded = () => handleNextRef.current?.(true);
        const onCanPlay = () => setIsLoading(false);
        const onWaiting = () => setIsLoading(true);
        const onError = () => {
            setIsLoading(false);
            console.error('Audio playback error');
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('error', onError);

        return () => {
            audio.pause();
            audio.src = '';
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('error', onError);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 监听音量变化
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 监听当前曲目变化 - 加载音频
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || currentIndex < 0 || currentIndex >= playlist.length) return;

        const track = playlist[currentIndex];
        if (!track?.blobUrl) return;

        // 只在 URL 真正变化时才重新加载
        if (audio.src !== track.blobUrl) {
            const wasPlaying = isPlaying;
            setIsLoading(true);
            audio.src = track.blobUrl;
            audio.load();

            if (wasPlaying) {
                audio.play().catch(err => {
                    console.error('Playback failed:', err);
                    setIsPlaying(false);
                });
            }
        }
    }, [currentIndex, playlist, isPlaying]);

    // 监听播放状态变化
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || currentIndex < 0) return;

        if (isPlaying && audio.paused && audio.readyState >= 2) {
            audio.play().catch(err => {
                console.error('Playback failed:', err);
                setIsPlaying(false);
            });
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [isPlaying, currentIndex]);

    // 添加文件到播放列表
    const addFiles = useCallback(async (files: File[]) => {
        const newTracks: LocalTrack[] = [];

        for (const file of files) {
            const blobUrl = URL.createObjectURL(file);
            let coverUrl: string | undefined;
            let artist: string | undefined;
            let title: string = file.name.replace(/\.[^/.]+$/, ''); // 默认使用去掉扩展名的文件名

            try {
                const metadata = await parseBlob(file);
                const picture = metadata.common.picture?.[0];
                if (picture) {
                    const blob = new Blob([picture.data as BlobPart], { type: picture.format });
                    coverUrl = URL.createObjectURL(blob);
                }
                // 提取艺术家和标题
                artist = metadata.common.artist;
                if (metadata.common.title) {
                    title = metadata.common.title;
                }
            } catch (error) {
                console.warn('Failed to extract metadata:', error);
            }

            newTracks.push({
                file,
                name: title,
                artist,
                blobUrl,
                coverUrl
            });
        }

        setPlaylist(prev => {
            const updated = [...prev, ...newTracks];
            // 如果之前没有曲目，自动选中第一个
            if (prev.length === 0 && updated.length > 0) {
                setCurrentIndex(0);
            }
            return updated;
        });
    }, []);

    // 播放指定曲目
    const playTrack = useCallback((index: number) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentIndex(index);
            setIsPlaying(true);
        }
    }, [playlist.length]);

    // 播放/暂停切换
    const togglePlay = useCallback(() => {
        if (playlist.length === 0) return;

        if (currentIndex === -1) {
            playTrack(0);
            return;
        }

        setIsPlaying(prev => !prev);
    }, [playlist.length, currentIndex, playTrack]);

    // 上一曲
    const handlePrev = useCallback(() => {
        if (playlist.length === 0) return;

        if (playMode === PlayMode.LOOP) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        let prevIndex: number;
        if (playMode === PlayMode.RANDOM && playlist.length > 1) {
            do {
                prevIndex = Math.floor(Math.random() * playlist.length);
            } while (prevIndex === currentIndex);
        } else {
            prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }

        setCurrentIndex(prevIndex);
        setIsPlaying(true);
    }, [playlist.length, playMode, currentIndex]);

    // 进度跳转
    const seek = useCallback((time: number) => {
        if (audioRef.current && duration > 0) {
            const newTime = Math.max(0, Math.min(time, duration));
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }, [duration]);

    // 切换播放模式
    const toggleMode = useCallback(() => {
        setPlayMode(prev => {
            if (prev === PlayMode.SEQUENCE) return PlayMode.LOOP;
            if (prev === PlayMode.LOOP) return PlayMode.RANDOM;
            return PlayMode.SEQUENCE;
        });
    }, []);

    // 删除曲目
    const removeTrack = useCallback((index: number) => {
        setPlaylist(prev => {
            const track = prev[index];
            if (track) {
                URL.revokeObjectURL(track.blobUrl);
                if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
            }

            const newList = prev.filter((_, i) => i !== index);

            // 调整当前索引
            if (index === currentIndex) {
                if (newList.length === 0) {
                    setCurrentIndex(-1);
                    setIsPlaying(false);
                } else if (index >= newList.length) {
                    setCurrentIndex(newList.length - 1);
                }
            } else if (index < currentIndex) {
                setCurrentIndex(prev => prev - 1);
            }

            return newList;
        });
    }, [currentIndex]);

    // 清空播放列表
    const clearPlaylist = useCallback(() => {
        playlist.forEach(track => {
            URL.revokeObjectURL(track.blobUrl);
            if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
        });
        setPlaylist([]);
        setCurrentIndex(-1);
        setIsPlaying(false);
    }, [playlist]);

    // 组件卸载时清理所有 Blob URL
    useEffect(() => {
        return () => {
            playlist.forEach(track => {
                URL.revokeObjectURL(track.blobUrl);
                if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null;

    return {
        // 状态
        playlist,
        currentTrack,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playMode,
        isLoading,
        // 控制方法
        addFiles,
        playTrack,
        togglePlay,
        handleNext: () => handleNext(false),
        handlePrev,
        seek,
        setVolume,
        toggleMode,
        removeTrack,
        clearPlaylist
    };
};
