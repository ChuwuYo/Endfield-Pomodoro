import React, { useState, useMemo } from 'react';
import { useMusicData, type MusicTrack } from '../hooks/useMusicData';
import { useOnlinePlayer } from '../hooks/useOnlinePlayer';
import { PlayMode } from '../types';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';
import PlayerInterface from './PlayerInterface';
import MessageDisplay from './MessageDisplay';

interface MusicPlayerProps {
    config: {
        server: string;
        type: string;
        id: string;
    };
    language: Language;
    enabled?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ config, language, enabled = true }) => {
    const t = useTranslation(language);

    const { audioList: metingData, loading: dataLoading, error: dataError } = useMusicData(config);
    const [isListOpen, setIsListOpen] = useState(false);

    // 转换数据格式以适配 useOnlinePlayer
    const playlist = useMemo(() => {
        return metingData.map((item: MusicTrack) => ({
            name: item.name,
            artist: item.artist,
            url: item.url,
            cover: item.cover,
            lrc: item.lrc
        }));
    }, [metingData]);

    const player = useOnlinePlayer(playlist, false, enabled);

    // 映射 PlayMode 到 AudioMode
    const mapPlayMode = (mode: string): AudioMode => {
        switch (mode) {
            case PlayMode.SEQUENCE: return AudioMode.SEQUENTIAL;
            case PlayMode.LOOP: return AudioMode.REPEAT_ONE;
            case PlayMode.RANDOM: return AudioMode.SHUFFLE;
            default: return AudioMode.SEQUENTIAL;
        }
    };

    if (dataLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <MessageDisplay 
                    messageKey="CONNECTING" 
                    language={language} 
                />
            </div>
        );
    }

    if (dataError) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
                <i className="ri-error-warning-line text-xl mb-1"></i>
                <div className="text-xs font-mono">{t('CONNECTION_LOST')}</div>
            </div>
        );
    }

    if (!player.currentSong) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-theme-dim">
                <i className="ri-disc-line text-xl mb-1"></i>
                <div className="text-xs font-mono">{t('NO_TRACK')}</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full relative">
            <PlayerInterface
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                duration={player.duration}
                volume={player.volume}
                currentTrackName={player.currentSong.name}
                currentArtist={player.currentSong.artist}
                coverUrl={player.currentSong.cover}
                playlistCount={playlist.length}
                currentIndex={player.currentIndex}
                playMode={mapPlayMode(player.playMode)}
                language={language}
                isLoading={player.isLoading}
                onPlayPause={player.togglePlay}
                onNext={() => player.handleNext()}
                onPrev={player.handlePrev}
                onSeek={player.seek}
                onVolumeChange={player.setVolume}
                onModeToggle={player.toggleMode}
                onPlaylistToggle={() => setIsListOpen(!isListOpen)}
            />

            {/* 播放列表 (绝对定位覆盖) */}
            {isListOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-theme-surface/95 backdrop-blur-md border border-theme-primary/30 rounded-md z-50 max-h-60 overflow-hidden shadow-xl">
                    <div className="sticky top-0 bg-theme-surface/95 border-b border-theme-highlight/20 p-2 flex justify-between items-center text-xs text-theme-dim">
                        <span>{t('PLAYLIST_TITLE')} [{playlist.length}]</span>
                        <button onClick={() => setIsListOpen(false)} className="hover:text-theme-primary"><i className="ri-close-line"></i></button>
                    </div>
                    <ul className="p-1 overflow-y-auto max-h-[calc(15rem-2.5rem)]" style={{ scrollbarGutter: 'stable' }}>
                        {playlist.map((song, index) => (
                            <li key={index}
                                className={`flex items-center p-2 hover:bg-theme-highlight/10 cursor-pointer text-xs border-b border-theme-highlight/5 last:border-0 ${index === player.currentIndex ? 'text-theme-primary bg-theme-primary/5' : 'text-theme-text'}`}
                                onClick={() => {
                                    player.playTrack(index);
                                    setIsListOpen(false);
                                }}>
                                <span className="w-6 text-theme-dim font-mono">{String(index + 1).padStart(2, '0')}</span>
                                <span className="flex-1 truncate mr-2">{song.name}</span>
                                <span className="text-theme-dim truncate max-w-[80px] text-right">{song.artist}</span>
                                {index === player.currentIndex && <i className="ri-volume-up-line ml-2 animate-pulse"></i>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MusicPlayer;
