import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { type MusicTrack, useMusicData } from "../hooks/useMusicData";
import { useOnlinePlayer } from "../hooks/useOnlinePlayer";
import { AudioMode, Language, PlayMode } from "../types";
import { useTranslation } from "../utils/i18n";
import MessageDisplay from "./MessageDisplay";
import PlayerInterface from "./PlayerInterface";

interface MusicPlayerProps {
    config: {
        server: string;
        type: string;
        id: string;
    };
    language: Language;
    enabled?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
    config,
    language,
    enabled = true,
}) => {
    const t = useTranslation(language);

    const {
        audioList: metingData,
        loading: dataLoading,
        error: dataError,
        retryWithNextAdapter,
        fetchTrackUrl,
    } = useMusicData(config);
    const [isListOpen, setIsListOpen] = useState(false);
    const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
    const errorCountRef = useRef(0);
    const trackFixAbortRef = useRef<AbortController | null>(null);

    // 组件卸载时取消未完成的请求
    useEffect(() => {
        return () => {
            if (trackFixAbortRef.current) {
                trackFixAbortRef.current.abort();
            }
        };
    }, []);

    // 本地维护一个 URL 覆盖映射，用于存储单曲修复后的 URL
    const [urlOverrides, setUrlOverrides] = useState<Record<string, string>>(
        {},
    );

    // 转换数据格式以适配 useOnlinePlayer
    const playlist = useMemo(() => {
        return metingData.map((item: MusicTrack) => ({
            id: item.id,
            name: item.name,
            artist: item.artist,
            url: (item.id && urlOverrides[item.id]) || item.url,
            cover: item.cover,
            lrc: item.lrc,
        }));
    }, [metingData, urlOverrides]);

    const handleTrackFix = useCallback(
        async (index: number): Promise<string | null> => {
            // 取消上一次可能的请求
            if (trackFixAbortRef.current) {
                trackFixAbortRef.current.abort();
            }
            const controller = new AbortController();
            trackFixAbortRef.current = controller;

            const track = metingData[index];
            if (!track || !track.id) return null;

            const newUrl = await fetchTrackUrl(track.id, controller.signal);

            if (controller.signal.aborted) return null;

            if (newUrl) {
                // 修复成功，重置错误计数
                errorCountRef.current = 0;

                setUrlOverrides((prev) => ({
                    ...prev,
                    [track.id]: newUrl,
                }));
                return newUrl;
            }

            console.warn(
                `[MusicPlayer] Track fallback failed for: ${track.name}`,
            );

            // 修复失败，增加错误计数
            errorCountRef.current += 1;

            if (errorCountRef.current >= 2) {
                console.warn(
                    "[MusicPlayer] Playlist playback failed consistently, switching to next API adapter for entire playlist...",
                );
                setUrlOverrides({});
                retryWithNextAdapter();
                errorCountRef.current = 0;
            }

            return null;
        },
        [metingData, fetchTrackUrl, retryWithNextAdapter],
    );

    const player = useOnlinePlayer(playlist, false, enabled, handleTrackFix);

    // 当播放列表打开或当前索引变化时，滚动到当前项
    useEffect(() => {
        const scrollToCurrentItem = () => {
            const itemEl = itemRefs.current.get(player.currentIndex);
            if (itemEl) {
                itemEl.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        };

        if (isListOpen) {
            // 使用 requestAnimationFrame 确保 DOM 已更新
            const rafId = requestAnimationFrame(() => {
                scrollToCurrentItem();
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [isListOpen, player.currentIndex]);

    // 映射 PlayMode 到 AudioMode
    const mapPlayMode = (mode: PlayMode): AudioMode => {
        switch (mode) {
            case PlayMode.SEQUENCE:
                return AudioMode.SEQUENTIAL;
            case PlayMode.LOOP:
                return AudioMode.REPEAT_ONE;
            case PlayMode.RANDOM:
                return AudioMode.SHUFFLE;
            default:
                return AudioMode.SEQUENTIAL;
        }
    };

    if (dataLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <MessageDisplay messageKey="CONNECTING" language={language} />
            </div>
        );
    }

    if (dataError) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
                <i className="ri-error-warning-line icon-ui-xl mb-1"></i>
                <div className="text-ui-xs font-ui-mono">
                    {t("CONNECTION_LOST")}
                </div>
            </div>
        );
    }

    if (!player.currentSong) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-theme-dim">
                <i className="ri-disc-line icon-ui-xl mb-1"></i>
                <div className="text-ui-xs font-ui-mono">{t("NO_TRACK")}</div>
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
                    <div className="sticky top-0 bg-theme-surface/95 border-b border-theme-highlight/20 p-2 flex justify-between items-center text-ui-xs text-theme-dim">
                        <span>
                            {t("PLAYLIST_TITLE")} [{playlist.length}]
                        </span>
                        <button
                            onClick={() => setIsListOpen(false)}
                            className="hover:text-theme-primary cursor-pointer"
                        >
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                    <ul
                        className="p-1 overflow-y-auto max-h-[calc(15rem-2.5rem)]"
                        style={{ scrollbarGutter: "stable" }}
                    >
                        {playlist.map((song, index) => (
                            <li
                                key={song.id || song.url || index}
                                ref={(el) => {
                                    if (el) itemRefs.current.set(index, el);
                                    else itemRefs.current.delete(index);
                                }}
                                className={`flex items-center p-2 hover:bg-theme-highlight/10 cursor-pointer text-ui-xs border-b border-theme-highlight/5 last:border-0 ${index === player.currentIndex ? "text-theme-primary bg-theme-primary/5" : "text-theme-text"}`}
                                onClick={() => {
                                    // 保持当前播放状态：如果正在播放则继续播放，如果暂停则保持暂停
                                    player.playTrack(index, true);
                                    // 不关闭播放列表
                                }}
                            >
                                <span className="w-6 text-theme-dim font-ui-mono">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="flex-1 truncate mr-2">
                                    {song.name}
                                </span>
                                <span className="text-theme-dim truncate max-w-[80px] text-right">
                                    {song.artist}
                                </span>
                                {index === player.currentIndex && (
                                    <i className="ri-volume-up-line ml-2 animate-pulse"></i>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MusicPlayer;
