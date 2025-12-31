import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Panel } from './TerminalUI';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';
import { STORAGE_KEYS, TOAST_DURATION_MS } from '../constants';
import MusicPlayer from './MusicPlayer';
import PlayerInterface from './PlayerInterface';
import MessageDisplay from './MessageDisplay';
import { useLocalPlayer } from '../hooks/useLocalPlayer';
import { PlayMode } from '../types';

const AudioPlayer: React.FC<{
    language: Language;
    musicConfig: { server: string; type: string; id: string };
    isOnline: boolean;
}> = ({ language, musicConfig, isOnline }) => {
    const t = useTranslation(language);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 音频源模式：'local' 本地文件 | 'online' 在线音乐
    // 优先从 localStorage 读取，如果没有则默认为 'online'
    const [audioSource, setAudioSource] = useState<'local' | 'online'>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.AUDIO_SOURCE);
        return (saved === 'local' || saved === 'online') ? saved : 'online';
    });

    // 使用本地播放器 hook
    const localPlayer = useLocalPlayer(audioSource === 'local');

    // 持久化音频源选择
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.AUDIO_SOURCE, audioSource);
    }, [audioSource]);

    // Toast 提示状态
    const [showOnlineToast, setShowOnlineToast] = useState(false);
    const prevOnlineRef = useRef(isOnline);

    // 离线时自动切换到本地模式，在线时显示提示
    useEffect(() => {
        if (!isOnline && audioSource === 'online') {
            queueMicrotask(() => setAudioSource('local'));
        } else if (isOnline && !prevOnlineRef.current && audioSource === 'local') {
            queueMicrotask(() => setShowOnlineToast(true));
            const timer = setTimeout(() => setShowOnlineToast(false), TOAST_DURATION_MS);
            return () => clearTimeout(timer);
        }
        prevOnlineRef.current = isOnline;
    }, [isOnline, audioSource]);

    const [showPlaylist, setShowPlaylist] = useState(false);

    // 网络恢复按钮回调
    const handleSwitchToOnline = useCallback(() => {
        setShowOnlineToast(false);
        setAudioSource('online');
    }, []);

    // 网络恢复提示的 actionButton
    const onlineToastActionButton = useMemo(() => ({
        textKey: "SWITCH_TO_ONLINE" as const,
        onClick: handleSwitchToOnline
    }), [handleSwitchToOnline]);

    // 映射 PlayMode 到 AudioMode
    const mapPlayMode = (mode: PlayMode): AudioMode => {
        switch (mode) {
            case PlayMode.SEQUENCE: return AudioMode.SEQUENTIAL;
            case PlayMode.LOOP: return AudioMode.REPEAT_ONE;
            case PlayMode.RANDOM: return AudioMode.SHUFFLE;
            default: {
                const exhaustiveCheck: never = mode;
                return exhaustiveCheck;
            }
        }
    };

    // 处理文件选择
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            localPlayer.addFiles(Array.from(e.target.files));
        }
    };

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
                            : 'border-theme-highlight/50 text-theme-dim hover:text-theme-primary hover:border-theme-primary cursor-pointer'
                            }`}
                        title={!isOnline && audioSource === 'local' ? t('OFFLINE_MODE_ONLY') : audioSource === 'local' ? t('SWITCH_TO_ONLINE') : t('SWITCH_TO_LOCAL')}
                        disabled={!isOnline && audioSource === 'local'}
                    >
                        {audioSource === 'local' ? `⇄ ${t('ONLINE_MODE')}` : `⇄ ${t('LOCAL_MODE')}`}
                    </button>
                </div>
            }
        >
            {/* 网络恢复提示 */}
            {showOnlineToast && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50">
                    <MessageDisplay
                        messageKey="NETWORK_RESTORED"
                        language={language}
                        actionButton={onlineToastActionButton}
                    />
                </div>
            )}

            {audioSource === 'online' ? (
                <MusicPlayer config={musicConfig} language={language} enabled />
            ) : (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="audio/*"
                        multiple
                        className="hidden"
                    />

                    <PlayerInterface
                        isPlaying={localPlayer.isPlaying}
                        currentTime={localPlayer.currentTime}
                        duration={localPlayer.duration}
                        volume={localPlayer.volume}
                        currentTrackName={localPlayer.currentTrack?.name ?? null}
                        currentArtist={localPlayer.currentTrack?.artist}
                        coverUrl={localPlayer.currentTrack?.coverUrl}
                        playlistCount={localPlayer.playlist.length}
                        currentIndex={localPlayer.currentIndex}
                        playMode={mapPlayMode(localPlayer.playMode)}
                        language={language}
                        isLoading={localPlayer.isLoading}
                        onPlayPause={localPlayer.togglePlay}
                        onNext={localPlayer.handleNext}
                        onPrev={localPlayer.handlePrev}
                        onSeek={localPlayer.seek}
                        onVolumeChange={localPlayer.setVolume}
                        onModeToggle={localPlayer.toggleMode}
                        onPlaylistToggle={() => setShowPlaylist(true)}
                    />

                    {/* 播放列表弹出模态框 */}
                    {showPlaylist && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                            <div className="absolute inset-0" onClick={() => setShowPlaylist(false)}></div>

                            <div className="w-full max-w-lg bg-theme-base/95 border border-theme-primary/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[80vh] backdrop-blur-xl z-10" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between p-4 border-b border-theme-highlight bg-theme-surface/50">
                                    <h3 className="font-mono text-sm uppercase text-theme-primary tracking-widest">{t('PLAYLIST_COUNT')}</h3>
                                    <button
                                        onClick={() => setShowPlaylist(false)}
                                        className="text-theme-dim hover:text-theme-primary p-1 cursor-pointer"
                                    >
                                        <i className="ri-close-line text-xl"></i>
                                    </button>
                                </div>

                                <div className="overflow-y-auto p-2 custom-scrollbar flex-1 bg-black/20" style={{ scrollbarGutter: 'stable' }}>
                                    {localPlayer.playlist.length === 0 ? (
                                        <div className="text-center p-8 text-theme-dim font-mono text-xs">{t('NO_TRACK')}</div>
                                    ) : (
                                        <ul className="space-y-1">
                                            {localPlayer.playlist.map((track, idx) => (

                                                <li
                                                    key={track.id}
                                                    className={`flex items-start p-3 border border-transparent hover:bg-theme-highlight/20 hover:border-theme-highlight/50 transition-all duration-200 group ${idx === localPlayer.currentIndex ? 'bg-theme-primary/10 border-theme-primary/30' : ''}`}
                                                >
                                                    <div
                                                        className="flex items-start flex-1 min-w-0 cursor-pointer"
                                                        onClick={() => localPlayer.playTrack(idx)}
                                                    >
                                                        <div className={`w-8 font-mono text-xs pt-0.5 flex-shrink-0 ${idx === localPlayer.currentIndex ? 'text-theme-primary font-bold' : 'text-theme-dim'}`}>
                                                            {(idx + 1).toString().padStart(2, '0')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-mono text-sm truncate ${idx === localPlayer.currentIndex ? 'text-theme-primary' : 'text-theme-text group-hover:text-theme-primary'}`}>
                                                                {track.name}
                                                            </div>
                                                            {track.artist && (
                                                                <div className="font-mono text-xs text-theme-dim truncate mt-0.5">
                                                                    {track.artist}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {idx === localPlayer.currentIndex && localPlayer.isPlaying && (
                                                            <span className="text-xs text-theme-primary animate-pulse ml-2 flex items-center flex-shrink-0">
                                                                <i className="ri-rhythm-line text-base"></i>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            localPlayer.removeTrack(idx);
                                                        }}
                                                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-theme-dim hover:text-red-500 transition-all px-2 flex-shrink-0 self-center cursor-pointer"
                                                        title={t('DELETE_TRACK')}
                                                    >
                                                        <i className="ri-close-line text-lg"></i>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="p-4 border-t border-theme-highlight bg-theme-surface/50 flex justify-end gap-3">
                                    <div className="text-[10px] text-theme-dim self-center mr-auto">
                                        {localPlayer.playlist.length} {t('FILES_LOADED')}
                                        <div className="text-[9px]">{t('DUPLICATE_SKIP_HINT')}</div>
                                    </div>
                                    <button
                                        onClick={localPlayer.clearPlaylist}
                                        className="text-xs font-mono px-3 py-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                        disabled={localPlayer.playlist.length === 0}
                                    >
                                        {t('CLEAR')}
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-mono border border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-black px-4 py-1 transition-all uppercase flex items-center gap-1 cursor-pointer"
                                    >
                                        <i className="ri-add-line text-base"></i>
                                        {t('ADD_TRACKS')}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </Panel>
    );
};

export default AudioPlayer;
