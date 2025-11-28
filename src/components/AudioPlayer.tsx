
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Panel } from './TerminalUI';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';

const AudioPlayer: React.FC<{ language: Language }> = ({ language }) => {
    const t = useTranslation(language);
    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [playlist, setPlaylist] = useState<File[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [mode, setMode] = useState<AudioMode>(AudioMode.SEQUENTIAL);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setPlaylist((prev) => [...prev, ...newFiles]);

            // If playlist was empty, auto-select the first new track but don't auto-play immediately
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

        let nextIndex = 0;
        if (mode === AudioMode.SHUFFLE) {
            // Pick a random index distinct from current if possible
            if (playlist.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * playlist.length);
                } while (nextIndex === currentIndex);
            } else {
                nextIndex = 0;
            }
        } else {
            // Sequential
            nextIndex = (currentIndex + 1) % playlist.length;
        }
        playTrack(nextIndex);
    };

    const togglePlay = () => {
        if (playlist.length === 0) return;

        // If no track selected but playlist exists, start first
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
        setMode(mode === AudioMode.SEQUENTIAL ? AudioMode.SHUFFLE : AudioMode.SEQUENTIAL);
    };

    // Sync Audio Element with State
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Track audio playback time
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    useEffect(() => {
        if (currentIndex >= 0 && playlist[currentIndex] && audioRef.current) {
            const file = playlist[currentIndex];
            const url = URL.createObjectURL(file);
            audioRef.current.src = url;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Playback failed", e));
            }

            return () => {
                // Cleanup URL logic if needed
            };
        }
    }, [currentIndex, playlist, isPlaying]);

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
        <Panel className="p-4 h-full min-h-[160px]" title={t('AUDIO_MODULE')}>
            <div className="flex flex-col h-full w-full relative">
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

                {/* Main Display Area */}
                <div className="flex-1 min-h-0 flex flex-col justify-center mb-2">
                    <div className="flex justify-between items-end border-b border-theme-highlight/30 pb-2 mb-2">
                        <div className="flex flex-col overflow-hidden mr-4">
                            <span className="text-[10px] text-theme-dim uppercase tracking-widest">{t('STATUS')}</span>
                            {currentTrackName ? (
                                <div className="text-sm font-mono text-theme-primary truncate animate-pulse-fast leading-tight mt-1">
                                    {isPlaying ? '► ' : '❚❚ '} {currentTrackName}
                                </div>
                            ) : (
                                <div className="text-sm font-mono text-theme-dim uppercase leading-tight mt-1">{t('NO_TRACK')}</div>
                            )}
                        </div>
                        <div className="text-[10px] font-mono text-theme-dim text-right shrink-0">
                            {currentIndex + 1} / {playlist.length}
                        </div>
                    </div>

                    {/* Progress Bar & Controls Row */}
                    <div className="flex items-center gap-3">
                        {/* Time Display & Progress Bar */}
                        <div className="flex-1 flex flex-col gap-1">
                            {/* Progress Blocks */}
                            <div className="flex items-end justify-between h-6 gap-[2px]">
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const progress = duration > 0 ? currentTime / duration : 0;
                                    const blockThreshold = (i + 1) / 12;
                                    const isFilled = progress >= blockThreshold;
                                    const isPartial = progress >= (i / 12) && progress < blockThreshold;

                                    return (
                                        <div
                                            key={i}
                                            className="w-full bg-theme-primary/30 transition-all duration-300"
                                            style={{
                                                height: isFilled ? '100%' : isPartial ? `${((progress - (i / 12)) * 12) * 100}%` : '20%',
                                                opacity: isFilled ? 1 : isPartial ? 0.7 : 0.3
                                            }}
                                        ></div>
                                    );
                                })}
                            </div>
                            {/* Time Text */}
                            <div className="text-[9px] font-mono text-theme-dim text-center tracking-wider">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        {/* Show Playlist Button */}
                        <button
                            onClick={() => setShowPlaylist(true)}
                            className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-primary hover:border-theme-primary transition-colors rounded-sm"
                            title={t('PLAYLIST_BUTTON')}
                        >
                            {/* Material Symbols Light: queue_music */}
                            <i className="ri-play-list-line text-base"></i>
                        </button>

                        {/* Mode Switch */}
                        <button
                            onClick={toggleMode}
                            className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-secondary hover:border-theme-secondary transition-colors rounded-sm flex items-center gap-1"
                            title={mode === AudioMode.SEQUENTIAL ? t('MODE_SEQ') : t('MODE_SHUFFLE')}
                        >
                            {mode === AudioMode.SEQUENTIAL ? (
                                /* Material Symbols Light: repeat */
                                <i className="ri-repeat-line text-base"></i>
                            ) : (
                                /* Material Symbols Light: shuffle */
                                <i className="ri-shuffle-line text-base"></i>
                            )}
                            <span className="text-[10px] font-mono">{mode === AudioMode.SEQUENTIAL ? t('MODE_SEQ') : t('MODE_SHUFFLE')}</span>
                        </button>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between gap-3 shrink-0">
                    {/* Add Button */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0"
                        title={t('SELECT_TRACK')}
                    >
                        {/* Material Symbols Light: add */}
                        <i className="ri-add-line text-xl"></i>
                    </button>

                    {/* Play/Pause - Shortened fixed width */}
                    <button
                        onClick={togglePlay}
                        disabled={playlist.length === 0}
                        className={`w-14 h-9 flex items-center justify-center border transition-colors rounded-sm ${isPlaying ? 'bg-theme-primary text-black border-theme-primary' : 'border-theme-highlight text-theme-text hover:border-theme-primary'}`}
                        title={t('PLAY_PAUSE')}
                    >
                        {isPlaying ? (
                            /* Material Symbols Light: pause */
                            <i className="ri-pause-line text-2xl"></i>
                        ) : (
                            /* Material Symbols Light: play_arrow */
                            <i className="ri-play-fill text-2xl"></i>
                        )}
                    </button>

                    {/* Next Track */}
                    <button
                        onClick={playNext}
                        disabled={playlist.length === 0}
                        className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0"
                        title={t('NEXT_TRACK')}
                    >
                        {/* Material Symbols Light: skip_next */}
                        <i className="ri-skip-forward-line text-xl"></i>
                    </button>

                    {/* Volume Bar - Expanded to take remaining space */}
                    <div className="flex-1 h-9 flex items-center px-2 border border-theme-highlight/30 rounded-sm bg-black/10">
                        <div className="w-full h-1 bg-theme-highlight/30 relative cursor-pointer group rounded-full overflow-hidden">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div
                                className="h-full bg-theme-dim group-hover:bg-theme-primary transition-all relative"
                                style={{ width: `${volume * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* PLAYLIST POPUP MODAL (Portal to Body) */}
                {showPlaylist && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                        {/* Backdrop Click to Close */}
                        <div className="absolute inset-0" onClick={() => setShowPlaylist(false)}></div>

                        <div className="w-full max-w-md bg-theme-base/95 border border-theme-primary/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[80vh] backdrop-blur-xl z-10" onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
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

                            {/* List */}
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

                            {/* Footer Actions */}
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
            </div>
        </Panel>
    );
};

export default AudioPlayer;
