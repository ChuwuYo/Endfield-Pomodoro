import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MUSIC_VOLUME } from "../config/musicConfig";
import {
    AUDIO_LOADING_TIMEOUT_MS,
    STORAGE_KEYS,
    TIME_UPDATE_THROTTLE_SECONDS,
} from "../constants";
import { PlayMode } from "../types";
import { asyncPool } from "../utils/asyncPool";
import { useShuffle } from "./useShuffle";

export interface LocalTrack {
    id: string;
    file: File;
    name: string;
    artist?: string;
    blobUrl: string;
    coverUrl?: string;
}

export const useLocalPlayer = (enabled: boolean = true) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastTimeRef = useRef(0);
    const [playlist, setPlaylist] = useState<LocalTrack[]>([]);
    const playlistRef = useRef<LocalTrack[]>([]);

    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
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

    const handleNextRef = useRef<((isAuto: boolean) => void) | null>(null);
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const playModeRef = useRef(playMode);
    useEffect(() => {
        playModeRef.current = playMode;
    }, [playMode]);

    const { getNextRandomIndex, getPrevRandomIndex } = useShuffle(
        playlist.length,
        playMode,
        currentIndex,
    );

    const handleNext = useCallback(
        (isAuto: boolean = false) => {
            if (playlist.length === 0) return;

            if (playMode === PlayMode.LOOP && isAuto) {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    if (isPlayingRef.current) {
                        audioRef.current.play();
                    }
                }
                return;
            }

            let nextIndex: number;
            if (playMode === PlayMode.RANDOM) {
                nextIndex = getNextRandomIndex();
            } else {
                nextIndex = (currentIndex + 1) % playlist.length;
            }

            setCurrentIndex(nextIndex);
        },
        [playlist.length, playMode, currentIndex, getNextRandomIndex],
    );

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const onTimeUpdate = () => {
            const time = audio.currentTime;
            if (
                Math.abs(time - lastTimeRef.current) >=
                TIME_UPDATE_THROTTLE_SECONDS
            ) {
                lastTimeRef.current = time;
                setCurrentTime(time);
            }
        };
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };
        const onEnded = () => handleNextRef.current?.(true);
        const onCanPlay = () => setIsLoading(false);
        const onWaiting = () => setIsLoading(true);
        // 系统或浏览器暂停/恢复（耳机断开、来电、其他应用占用音频）时同步状态；切歌和播放结束时忽略
        const onPause = () => {
            if (
                audio.ended ||
                audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
            ) {
                return;
            }
            setIsPlaying(false);
        };
        const onPlay = () => setIsPlaying(true);
        const onError = () => {
            setIsLoading(false);
            console.error("Audio playback error");
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("waiting", onWaiting);
        audio.addEventListener("error", onError);
        audio.addEventListener("pause", onPause);
        audio.addEventListener("play", onPlay);

        return () => {
            audio.removeEventListener("pause", onPause);
            audio.removeEventListener("play", onPlay);
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("waiting", onWaiting);
            audio.removeEventListener("error", onError);
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
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
        const audio = audioRef.current;
        if (!audio || currentIndex < 0 || currentIndex >= playlist.length)
            return;

        const track = playlist[currentIndex];
        if (!track?.blobUrl) return;

        if (audio.src !== track.blobUrl) {
            const wasPlaying = isPlaying;
            setIsLoading(true);
            audio.src = track.blobUrl;
            audio.load();

            if (wasPlaying) {
                audio.play().catch((err) => {
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    )
                        return;
                    console.error("Playback failed:", err);
                    setIsPlaying(false);
                });
            }
        }
    }, [currentIndex, playlist, isPlaying]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || currentIndex < 0) return;

        if (
            isPlaying &&
            audio.paused &&
            audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            audio.play().catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError")
                    return;
                console.error("Playback failed:", err);
                setIsPlaying(false);
            });
        } else if (
            isPlaying &&
            audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            const onCanPlay = () => {
                audio.play().catch((err) => {
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    )
                        return;
                    console.error("Playback failed:", err);
                    setIsPlaying(false);
                });
            };
            audio.addEventListener("canplay", onCanPlay, { once: true });

            const timeoutId = setTimeout(() => {
                if (
                    audioRef.current &&
                    audioRef.current.readyState <
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
        } else if (!isPlaying && !audio.paused) {
            audio.pause();
        }
    }, [isPlaying, currentIndex]);

    useEffect(() => {
        if (!enabled && audioRef.current) {
            audioRef.current.pause();
            queueMicrotask(() => setIsPlaying(false));
        }
    }, [enabled]);

    const addFiles = useCallback(async (files: File[]) => {
        const uniqueFiles = files.filter((file) => {
            const isDuplicate = playlistRef.current.some(
                (track) =>
                    track.file.name === file.name &&
                    track.file.size === file.size &&
                    track.file.lastModified === file.lastModified,
            );
            return !isDuplicate;
        });

        if (uniqueFiles.length === 0) return;

        const initialTracks: LocalTrack[] = uniqueFiles.map((file) => ({
            id: `${file.name}-${file.size}-${file.lastModified}`,
            file,
            name: file.name.replace(/\.[^/.]+$/, ""),
            artist: undefined,
            blobUrl: URL.createObjectURL(file),
            coverUrl: undefined,
        }));

        let startIndex = 0;
        const isFirstLoad = playlistRef.current.length === 0;
        if (
            isFirstLoad &&
            playModeRef.current === PlayMode.RANDOM &&
            uniqueFiles.length > 0
        ) {
            startIndex = Math.floor(Math.random() * uniqueFiles.length);
        }

        setPlaylist((prev) => {
            const updated = [...prev, ...initialTracks];
            if (prev.length === 0 && updated.length > 0) {
                setCurrentIndex(startIndex);
            }
            return updated;
        });

        const isTrackAlive = (id: string) =>
            playlistRef.current.some((track) => track.id === id);
        const revokeCover = (coverUrl?: string) => {
            if (coverUrl) URL.revokeObjectURL(coverUrl);
        };

        const parseFile = async (
            file: File,
        ): Promise<{
            id: string;
            name?: string;
            artist?: string;
            coverUrl?: string;
        }> => {
            const trackId = `${file.name}-${file.size}-${file.lastModified}`;
            try {
                const { parseBlob } = await import("music-metadata");
                const metadata = await parseBlob(file);
                const title =
                    metadata.common.title || file.name.replace(/\.[^/.]+$/, "");
                const artist = metadata.common.artist;
                const picture = metadata.common.picture?.[0];
                let coverUrl: string | undefined;

                if (picture) {
                    const blob = new Blob([picture.data as BlobPart], {
                        type: picture.format,
                    });
                    coverUrl = URL.createObjectURL(blob);
                }
                return { id: trackId, name: title, artist, coverUrl };
            } catch (error) {
                console.warn("Failed to extract metadata:", error);
                return { id: trackId };
            }
        };

        if (isFirstLoad && uniqueFiles[startIndex]) {
            const metadata = await parseFile(uniqueFiles[startIndex]);
            if (!isTrackAlive(metadata.id)) {
                revokeCover(metadata.coverUrl);
            } else if (metadata.name || metadata.artist) {
                setPlaylist((prev) =>
                    prev.map((track) =>
                        track.id === metadata.id
                            ? { ...track, ...metadata }
                            : track,
                    ),
                );
            }
        }

        const restFiles = isFirstLoad
            ? uniqueFiles.filter((_, i) => i !== startIndex)
            : uniqueFiles;

        if (restFiles.length > 0) {
            const CONCURRENCY_LIMIT = 5;
            const results = await asyncPool(
                CONCURRENCY_LIMIT,
                restFiles,
                parseFile,
            );
            const liveResults = results.filter((r) => {
                if (isTrackAlive(r.id)) return true;
                revokeCover(r.coverUrl);
                return false;
            });

            setPlaylist((prev) => {
                const updates = new Map(liveResults.map((r) => [r.id, r]));
                return prev.map((track) => {
                    const update = updates.get(track.id);
                    return update ? { ...track, ...update } : track;
                });
            });
        }
    }, []);

    const playTrack = useCallback(
        (index: number, keepPlayState: boolean = false) => {
            if (index >= 0 && index < playlist.length) {
                setCurrentIndex(index);
                if (!keepPlayState) {
                    setIsPlaying(true);
                }
            }
        },
        [playlist.length],
    );

    const togglePlay = useCallback(() => {
        if (playlist.length === 0) return;

        if (currentIndex === -1) {
            playTrack(0);
            return;
        }

        setIsPlaying((prev) => !prev);
    }, [playlist.length, currentIndex, playTrack]);

    const play = useCallback(() => {
        if (playlist.length === 0) return;
        if (currentIndex === -1) {
            playTrack(0);
            return;
        }
        const audio = audioRef.current;
        if (
            audio &&
            audio.paused &&
            audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            audio.play().catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError")
                    return;
                console.error("Playback failed:", err);
                setIsPlaying(false);
            });
        }
        setIsPlaying(true);
    }, [playlist.length, currentIndex, playTrack]);

    const pause = useCallback(() => {
        audioRef.current?.pause();
        setIsPlaying(false);
    }, []);

    const handlePrev = useCallback(() => {
        if (playlist.length === 0) return;

        if (playMode === PlayMode.LOOP) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                if (isPlayingRef.current) {
                    audioRef.current.play();
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
    }, [playlist.length, playMode, currentIndex, getPrevRandomIndex]);

    const seek = useCallback(
        (time: number) => {
            if (audioRef.current && duration > 0) {
                const newTime = Math.max(0, Math.min(time, duration));
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
            }
        },
        [duration],
    );

    const toggleMode = useCallback(() => {
        setPlayMode((prev) => {
            if (prev === PlayMode.SEQUENCE) return PlayMode.LOOP;
            if (prev === PlayMode.LOOP) return PlayMode.RANDOM;
            return PlayMode.SEQUENCE;
        });
    }, []);

    const removeTrack = useCallback(
        (index: number) => {
            const currentList = playlistRef.current;
            const track = currentList[index];
            if (track) {
                URL.revokeObjectURL(track.blobUrl);
                if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
            }

            const newList = currentList.filter((_, i) => i !== index);

            let newIndex = currentIndex;
            if (index === currentIndex) {
                if (newList.length === 0) {
                    newIndex = -1;
                    queueMicrotask(() => setIsPlaying(false));
                } else if (index >= newList.length) {
                    newIndex = newList.length - 1;
                }
            } else if (index < currentIndex) {
                newIndex = currentIndex - 1;
            }

            setPlaylist(newList);
            if (newIndex !== currentIndex) {
                setCurrentIndex(newIndex);
            }
        },
        [currentIndex],
    );

    const clearPlaylist = useCallback(() => {
        playlistRef.current.forEach((track) => {
            URL.revokeObjectURL(track.blobUrl);
            if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
        });
        setPlaylist([]);
        setCurrentIndex(-1);
        setIsPlaying(false);
    }, []);

    useEffect(() => {
        return () => {
            // 使用 ref 中的最新 playlist，而不是闭包中的初始空 playlist
            playlistRef.current.forEach((track) => {
                URL.revokeObjectURL(track.blobUrl);
                if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
            });
        };
    }, []);

    const currentTrack = currentIndex >= 0 ? playlist[currentIndex] : null;

    return {
        playlist,
        currentTrack,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playMode,
        isLoading,
        addFiles,
        playTrack,
        togglePlay,
        play,
        pause,
        handleNext: () => handleNext(false),
        handlePrev,
        seek,
        setVolume,
        toggleMode,
        removeTrack,
        clearPlaylist,
    };
};
