import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Panel } from './TerminalUI';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';
import MusicPlayer from './MusicPlayer';
import PlayerInterface from './PlayerInterface';

const AudioPlayer: React.FC<{
    language: Language;
    musicConfig: { server: string; type: string; id: string };
}> = ({ language, musicConfig }) => {
    const t = useTranslation(language);
    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 音频源模式：'local' 本地文件 | 'online' 在线音乐
    // 优先从 localStorage 读取，如果没有则默认为 'online'
    const [audioSource, setAudioSource] = useState<'local' | 'online'>(() => {
        const saved = localStorage.getItem('origin_terminal_audio_source');
        return (saved === 'local' || saved === 'online') ? saved : 'online';
    });

    // 持久化音频源选择
    useEffect(() => {
        localStorage.setItem('origin_terminal_audio_source', audioSource);
    }, [audioSource]);

    const [playlist, setPlaylist] = useState<File[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [mode, setMode] = useState<AudioMode>(AudioMode.SEQUENTIAL);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

    const handleSeek = useCallback((newTime: number) => {
        if (audioRef.current && duration > 0) {
            const clampedTime = Math.max(0, Math.min(newTime, duration));
            audioRef.current.currentTime = clampedTime;
            setCurrentTime(clampedTime);
        }
    }, [duration]);

    // 同步音频元素与状态
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // 跟踪音频播放时间
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };
        const handleLoadedMetadata = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    // 当曲目改变时加载音频源（不在播放/暂停切换时）
    useEffect(() => {
        if (currentIndex >= 0 && playlist[currentIndex] && audioRef.current) {
            const file = playlist[currentIndex];
            const url = URL.createObjectURL(file);
            audioRef.current.src = url;
            audioRef.current.load();

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [currentIndex, playlist]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(() => setIsPlaying(false));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const currentTrackName = currentIndex >= 0 && playlist[currentIndex] ? playlist[currentIndex].name : null;

    return (
        <Panel
            className="p-4 h-full min-h-[160px]"
            title={
                <div className="flex items-center justify-between w-full">
                    <span>{t('AUDIO_MODULE')}</span>
                    <button
                        onClick={() => setAudioSource(prev => prev === 'local' ? 'online' : 'local')}
                        className="px-2 py-0.5 text-[9px] font-mono border border-theme-highlight/50 text-theme-dim hover:text-theme-primary hover:border-theme-primary transition-colors rounded-sm uppercase tracking-wider"
                        title={audioSource === 'local' ? t('SWITCH_TO_ONLINE') : t('SWITCH_TO_LOCAL')}
                    >
                        {audioSource === 'local' ? `⇄ ${t('ONLINE_MODE')}` : `⇄ ${t('LOCAL_MODE')}`}
                    </button>
                </div>
            }
        >
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
                                                        className={`flex items-center p-3 cursor-pointer border border-transparent hover:bg-theme-highlight/20 hover:border-theme-highlight/50 transition-all duration-200 group ${idx === currentIndex ? 'bg-theme-primary/10 border-theme-primary/30' : ''}`}
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
                                            onClick={() => setPlaylist([])}
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
                                            {t('ADD_TASK')}
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