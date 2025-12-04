import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Panel } from './TerminalUI';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';
import { STORAGE_KEYS, TOAST_DURATION_MS } from '../constants';
import MusicPlayer from './MusicPlayer';
import PlayerInterface from './PlayerInterface';
import MessageDisplay from './MessageDisplay';
import { parseBlob } from 'music-metadata';

const AudioPlayer: React.FC<{
    language: Language;
    musicConfig: { server: string; type: string; id: string };
    isOnline: boolean;
}> = ({ language, musicConfig, isOnline }) => {
    const t = useTranslation(language);
    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 音频源模式：'local' 本地文件 | 'online' 在线音乐
    // 优先从 localStorage 读取，如果没有则默认为 'online'
    const [audioSource, setAudioSource] = useState<'local' | 'online'>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.AUDIO_SOURCE);
        return (saved === 'local' || saved === 'online') ? saved : 'online';
    });

    const [playlist, setPlaylist] = useState<File[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);

    // 持久化音频源选择，并在切换时重置播放状态
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.AUDIO_SOURCE, audioSource);
        // 切换模式时重置播放状态
        setIsPlaying(false);
    }, [audioSource]);

    // Toast 提示状态
    const [showOnlineToast, setShowOnlineToast] = useState(false);
    const prevOnlineRef = useRef(isOnline);

    // 离线时自动切换到本地模式，在线时显示提示
    useEffect(() => {
        if (!isOnline && audioSource === 'online') {
            // 离线时自动切换到本地模式
            setAudioSource('local');
        } else if (isOnline && !prevOnlineRef.current && audioSource === 'local') {
            // 从离线恢复到在线时显示提示
            setShowOnlineToast(true);
            const timer = setTimeout(() => setShowOnlineToast(false), TOAST_DURATION_MS);
            return () => clearTimeout(timer);
        }
        prevOnlineRef.current = isOnline;
    }, [isOnline, audioSource]);

    const [volume, setVolume] = useState(0.5);
    const [mode, setMode] = useState<AudioMode>(AudioMode.SEQUENTIAL);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setPlaylist((prev) => [...prev, ...newFiles]);

            // 如果播放列表为空，自动选择第一个新曲目但不立即自动播放
            if (currentIndex === -1) {
                setCurrentIndex(0);
            }
        }
    };

    // 提取音频封面
    const extractCoverArt = async (file: File) => {
        let newCoverUrl: string | undefined;
        try {
            const metadata = await parseBlob(file);
            const picture = metadata.common.picture?.[0];

            if (picture) {
                const blob = new Blob([picture.data as BlobPart], { type: picture.format });
                newCoverUrl = URL.createObjectURL(blob);
            }
        } catch (error) {
            console.warn('Failed to extract cover art:', error);
        }

        setCoverUrl(prevUrl => {
            if (prevUrl) {
                URL.revokeObjectURL(prevUrl);
            }
            return newCoverUrl;
        });
    };

    // 切换到在线模式时清理封面URL
    useEffect(() => {
        if (audioSource === 'online') {
            setCoverUrl(prevUrl => {
                if (prevUrl) {
                    URL.revokeObjectURL(prevUrl);
                }
                return undefined;
            });
        }
    }, [audioSource]);

    // 组件卸载时清理封面URL
    useEffect(() => {
        return () => {
            setCoverUrl(prevUrl => {
                if (prevUrl) {
                    URL.revokeObjectURL(prevUrl);
                }
                return undefined;
            });
        };
    }, []);



    const playTrack = (index: number) => {
        if (index >= 0 && index < playlist.length) {
            setCurrentIndex(index);
            setIsPlaying(true);
        }
    };

    const playNext = () => {
        if (playlist.length === 0) return;

        if (mode === AudioMode.REPEAT_ONE) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        let nextIndex = 0;
        if (mode === AudioMode.SHUFFLE) {
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
        playTrack(nextIndex);
    };

    const playPrevious = () => {
        if (playlist.length === 0) return;

        if (mode === AudioMode.REPEAT_ONE) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
            }
            return;
        }

        let prevIndex = 0;
        if (mode === AudioMode.SHUFFLE) {
            if (playlist.length > 1) {
                do {
                    prevIndex = Math.floor(Math.random() * playlist.length);
                } while (prevIndex === currentIndex);
            } else {
                prevIndex = 0;
            }
        } else {
            prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }
        playTrack(prevIndex);
    };

    const togglePlay = () => {
        if (playlist.length === 0) return;

        // 如果没有选择曲目但播放列表存在，从第一个开始
        if (currentIndex === -1) {
            playTrack(0);
            return;
        }

        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMode = () => {
        if (mode === AudioMode.SEQUENTIAL) {
            setMode(AudioMode.REPEAT_ONE);
        } else if (mode === AudioMode.REPEAT_ONE) {
            setMode(AudioMode.SHUFFLE);
        } else {
            setMode(AudioMode.SEQUENTIAL);
        }
    };

    const handleSeek = (newTime: number) => {
        if (audioRef.current && duration > 0) {
            const clampedTime = Math.max(0, Math.min(newTime, duration));
            audioRef.current.currentTime = clampedTime;
            setCurrentTime(clampedTime);
        }
    };

    // 同步音频元素与音量
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 用 ref 跟踪是否应该在加载完成后自动播放
    const shouldAutoPlayRef = useRef(false);

    // 当曲目改变时加载音频源并提取封面（仅本地模式）
    useEffect(() => {
        // 只在本地模式下处理
        if (audioSource !== 'local') return;

        if (currentIndex >= 0 && playlist[currentIndex] && audioRef.current) {
            const file = playlist[currentIndex];
            const url = URL.createObjectURL(file);
            const audio = audioRef.current;

            // 重置状态
            setCurrentTime(0);
            setDuration(0);

            // 提取封面
            extractCoverArt(file);

            // 设置音频源
            audio.src = url;

            // 记录当前是否应该自动播放
            shouldAutoPlayRef.current = isPlaying;

            // 添加一次性事件监听器来处理加载
            const handleLoadedMetadata = () => {
                setDuration(audio.duration || 0);
            };

            const handleCanPlay = () => {
                // 如果应该播放，则开始播放
                if (shouldAutoPlayRef.current) {
                    audio.play().catch((error) => {
                        console.error('Playback failed:', error);
                        setIsPlaying(false);
                    });
                }
            };

            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };

            audio.addEventListener('loadedmetadata', handleLoadedMetadata);
            audio.addEventListener('canplay', handleCanPlay);
            audio.addEventListener('timeupdate', handleTimeUpdate);

            // 加载音频
            audio.load();

            return () => {
                // 清理
                audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
                audio.removeEventListener('canplay', handleCanPlay);
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                URL.revokeObjectURL(url);
            };
        }
        // 注意：这里不要添加 isPlaying 依赖，否则暂停/播放会重新加载音频
        // 添加 audioSource 依赖，确保切换回本地模式时重新加载音频
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, playlist, audioSource, extractCoverArt]);

    // 控制播放/暂停（不依赖曲目切换）
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || currentIndex === -1) return;

        // 只在非加载状态下响应 isPlaying 变化
        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
            if (isPlaying && audio.paused) {
                audio.play().catch(() => setIsPlaying(false));
            } else if (!isPlaying && !audio.paused) {
                audio.pause();
            }
        }
    }, [isPlaying, currentIndex]);

    const currentTrackName = currentIndex >= 0 && playlist[currentIndex] ? playlist[currentIndex].name : null;

    return (
        <Panel
            className="p-4 h-full min-h-[160px] relative"
            title={
                <div className="flex items-center justify-between w-full">
                    <span>{t('AUDIO_MODULE')}</span>
                    <button
                        onClick={() => {
                            if (!isOnline && audioSource === 'local') return;
                            setAudioSource(prev => prev === 'local' ? 'online' : 'local');
                        }}
                        className={`px-2 py-0.5 text-[9px] font-mono border transition-colors rounded-sm uppercase tracking-wider ${!isOnline && audioSource === 'local'
                                ? 'border-theme-highlight/30 text-theme-dim/50 cursor-not-allowed'
                                : 'border-theme-highlight/50 text-theme-dim hover:text-theme-primary hover:border-theme-primary'
                            }`}
                        title={!isOnline && audioSource === 'local' ? t('OFFLINE_MODE_ONLY') : audioSource === 'local' ? t('SWITCH_TO_ONLINE') : t('SWITCH_TO_LOCAL')}
                        disabled={!isOnline && audioSource === 'local'}
                    >
                        {audioSource === 'local' ? `⇄ ${t('ONLINE_MODE')}` : `⇄ ${t('LOCAL_MODE')}`}
                    </button>
                </div>
            }
        >
            {/* 网络恢复提示 - 使用 MessageDisplay 组件 */}
            {showOnlineToast && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50">
                    <MessageDisplay 
                        messageKey="NETWORK_RESTORED" 
                        language={language} 
                        actionButton={{
                            textKey: "SWITCH_TO_ONLINE",
                            onClick: () => { setShowOnlineToast(false); setAudioSource('online'); }
                        }}
                    />
                </div>
            )}

            {audioSource === 'online' ? (
                // 在线音乐模式：使用 MusicPlayer 组件，占满全部高度
                <div className="flex flex-col h-full w-full">
                    <MusicPlayer config={musicConfig} language={language} />
                </div>
            ) : (
                // 本地文件模式
                <div className="flex flex-col h-full w-full relative">
                    <>
                        <audio
                            ref={audioRef}
                            onEnded={playNext}
                        />
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="audio/*"
                            multiple
                            className="hidden"
                        />

                        <PlayerInterface
                            isPlaying={isPlaying}
                            currentTime={currentTime}
                            duration={duration}
                            volume={volume}
                            currentTrackName={currentTrackName}
                            coverUrl={coverUrl}
                            playlistCount={playlist.length}
                            currentIndex={currentIndex}
                            playMode={mode}
                            language={language}
                            onPlayPause={togglePlay}
                            onNext={playNext}
                            onPrev={playPrevious}
                            onSeek={handleSeek}
                            onVolumeChange={setVolume}
                            onModeToggle={toggleMode}
                            onPlaylistToggle={() => setShowPlaylist(true)}
                        />

                        {/* 播放列表弹出模态框（门户到Body） */}
                        {showPlaylist && createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                                {/* 背景点击关闭 */}
                                <div className="absolute inset-0" onClick={() => setShowPlaylist(false)}></div>

                                <div className="w-full max-w-md bg-theme-base/95 border border-theme-primary/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[80vh] backdrop-blur-xl z-10" onClick={e => e.stopPropagation()}>
                                    {/* 模态框头部 */}
                                    <div className="flex items-center justify-between p-4 border-b border-theme-highlight bg-theme-surface/50">
                                        <h3 className="font-mono text-sm uppercase text-theme-primary tracking-widest">{t('PLAYLIST_COUNT')}</h3>
                                        <button
                                            onClick={() => setShowPlaylist(false)}
                                            className="text-theme-dim hover:text-theme-primary p-1"
                                        >
                                            {/* Material Symbols Light: close */}
                                            <i className="ri-close-line text-xl"></i>
                                        </button>
                                    </div>

                                    {/* 列表 */}
                                    <div className="overflow-y-auto p-2 custom-scrollbar flex-1 bg-black/20">
                                        {playlist.length === 0 ? (
                                            <div className="text-center p-8 text-theme-dim font-mono text-xs">{t('NO_TRACK')}</div>
                                        ) : (
                                            <ul className="space-y-1">
                                                {playlist.map((file, idx) => (
                                                    <li
                                                        key={idx}
                                                        className={`flex items-center p-3 border border-transparent hover:bg-theme-highlight/20 hover:border-theme-highlight/50 transition-all duration-200 group ${idx === currentIndex ? 'bg-theme-primary/10 border-theme-primary/30' : ''}`}
                                                    >
                                                        <div
                                                            className="flex items-center flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => playTrack(idx)}
                                                        >
                                                            <div className={`w-8 font-mono text-xs ${idx === currentIndex ? 'text-theme-primary font-bold' : 'text-theme-dim'}`}>
                                                                {(idx + 1).toString().padStart(2, '0')}
                                                            </div>
                                                            <div className={`flex-1 font-mono text-sm truncate ${idx === currentIndex ? 'text-theme-primary' : 'text-theme-text group-hover:text-theme-primary'}`}>
                                                                {file.name}
                                                            </div>
                                                            {idx === currentIndex && isPlaying && (
                                                                /* Material Symbols Light: graphic_eq */
                                                                <span className="text-xs text-theme-primary animate-pulse ml-2 flex items-center">
                                                                    <i className="ri-rhythm-line text-base"></i>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // 如果删除的是当前播放的曲目，清理封面URL
                                                                if (idx === currentIndex && coverUrl) {
                                                                    URL.revokeObjectURL(coverUrl);
                                                                    setCoverUrl(undefined);
                                                                }
                                                                const newPlaylist = playlist.filter((_, i) => i !== idx);
                                                                setPlaylist(newPlaylist);
                                                                // 如果删除的是当前播放的曲目
                                                                if (idx === currentIndex) {
                                                                    if (newPlaylist.length === 0) {
                                                                        setCurrentIndex(-1);
                                                                        setIsPlaying(false);
                                                                    } else if (idx >= newPlaylist.length) {
                                                                        setCurrentIndex(newPlaylist.length - 1);
                                                                    }
                                                                } else if (idx < currentIndex) {
                                                                    // 如果删除的曲目在当前播放曲目之前，需要调整索引
                                                                    setCurrentIndex(prev => prev - 1);
                                                                }
                                                            }}
                                                            className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-theme-dim hover:text-red-500 transition-all px-2 flex-shrink-0"
                                                            title={t('DELETE_TRACK')}
                                                        >
                                                            <i className="ri-close-line text-lg"></i>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* 底部操作 */}
                                    <div className="p-4 border-t border-theme-highlight bg-theme-surface/50 flex justify-end gap-3">
                                        <div className="text-[10px] text-theme-dim self-center mr-auto">
                                            {playlist.length} {t('FILES_LOADED')}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setCoverUrl(prevUrl => {
                                                    if (prevUrl) {
                                                        URL.revokeObjectURL(prevUrl);
                                                    }
                                                    return undefined;
                                                });
                                                setPlaylist([]);
                                                setCurrentIndex(-1);
                                                setIsPlaying(false);
                                            }}
                                            className="text-xs font-mono px-3 py-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                            disabled={playlist.length === 0}
                                        >
                                            {t('CLEAR')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                fileInputRef.current?.click();
                                            }}
                                            className="text-xs font-mono border border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-black px-4 py-1 transition-all uppercase flex items-center gap-1"
                                        >
                                            {/* Material Symbols Light: add */}
                                            <i className="ri-add-line text-base"></i>
                                            {t('ADD_TRACKS')}
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </>
                </div>
            )}
        </Panel>
    );
};

export default AudioPlayer;