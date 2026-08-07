import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { type MusicTrack, useMusicData } from "../hooks/useMusicData";
import { useOnlinePlayer } from "../hooks/useOnlinePlayer";
import { AudioMode, Language, PlayMode } from "../types";
import { useTranslation } from "../utils/i18n";
import { applyAnchoredPopoverPlacement } from "../utils/placeAnchoredPopover";
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

const supportsPopoverApi = () =>
    typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

const MusicPlayer: React.FC<MusicPlayerProps> = ({
    config,
    language,
    enabled = true,
}) => {
    const t = useTranslation(language);
    const playlistPanelId = useId();

    const {
        audioList: metingData,
        loading: dataLoading,
        error: dataError,
        retryWithNextAdapter,
        fetchTrackUrl,
    } = useMusicData(config);
    const [isListOpen, setIsListOpen] = useState(false);
    const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
    const rootRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const errorCountRef = useRef(0);
    const trackFixAbortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            if (trackFixAbortRef.current) {
                trackFixAbortRef.current.abort();
            }
        };
    }, []);

    const [urlOverrides, setUrlOverrides] = useState<Record<string, string>>(
        {},
    );

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

    const repositionPlaylist = useCallback(() => {
        const popover = popoverRef.current;
        const anchor = rootRef.current;
        if (!popover || !anchor) return;
        // 对齐原 absolute top-full left-0 right-0 mt-2 + max-h-60
        applyAnchoredPopoverPlacement(popover, anchor, {
            gap: 8,
            padding: 16,
            minHeight: 120,
            maxHeightCap: 240,
        });
    }, []);

    const restorePlaylistFocus = useCallback(() => {
        queueMicrotask(() => {
            const popover = popoverRef.current;
            const active = document.activeElement;
            // 仅当焦点仍在列表内（Esc/关按钮）才归还；点外部关时保留用户点到的控件
            if (
                popover &&
                active instanceof Node &&
                !popover.contains(active)
            ) {
                return;
            }
            const trigger = rootRef.current?.querySelector(
                `[aria-controls="${CSS.escape(playlistPanelId)}"]`,
            );
            if (trigger instanceof HTMLElement) {
                trigger.focus();
            }
        });
    }, [playlistPanelId]);

    const closePlaylist = useCallback(() => {
        const el = popoverRef.current;
        if (el && supportsPopoverApi() && el.matches(":popover-open")) {
            el.hidePopover();
            return;
        }
        setIsListOpen(false);
        restorePlaylistFocus();
    }, [restorePlaylistFocus]);

    const togglePlaylist = useCallback(() => {
        const el = popoverRef.current;
        if (el && supportsPopoverApi()) {
            el.togglePopover();
            return;
        }
        // 无 Popover：触发按钮点击切换；焦点已在按钮上，无需副作用恢复
        setIsListOpen((open) => !open);
    }, []);

    // 播放器 UI（含 popover 节点）是否已挂载。
    // loading/error/empty 会 early-return，若只在 mount 绑 toggle，节点晚出现时监听器永远挂不上，
    // 列表会停在 Popover 默认左上角且 isListOpen 不同步。
    const playlistUiReady = Boolean(
        !dataLoading && !dataError && player.currentSong,
    );

    // popovertarget / showPopover 的开关同步到 React（含 Esc、点外部）
    useEffect(() => {
        if (!playlistUiReady) return;
        const el = popoverRef.current;
        if (!el || !supportsPopoverApi()) return;

        const syncOpen = (open: boolean) => {
            setIsListOpen(open);
            if (open) {
                // MDN：打开后再设位置；双 rAF 避开 UA 居中样式覆盖
                requestAnimationFrame(() => {
                    requestAnimationFrame(repositionPlaylist);
                });
            } else {
                restorePlaylistFocus();
            }
        };

        const onToggle = (event: Event) => {
            const { newState } = event as ToggleEvent;
            syncOpen(newState === "open");
        };
        el.addEventListener("toggle", onToggle);
        // 监听器晚绑时若已打开，补一次同步与定位
        if (el.matches(":popover-open")) {
            syncOpen(true);
        }
        return () => el.removeEventListener("toggle", onToggle);
    }, [playlistUiReady, repositionPlaylist, restorePlaylistFocus]);

    // 无 Popover API：Esc / 点外部
    useEffect(() => {
        if (!isListOpen || supportsPopoverApi()) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                closePlaylist();
            }
        };
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node;
            if (
                popoverRef.current?.contains(target) ||
                rootRef.current?.contains(target)
            ) {
                return;
            }
            closePlaylist();
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [isListOpen, closePlaylist]);

    // 打开后跟随锚点；resize/scroll 时重算（下方不够则 flip）
    useEffect(() => {
        if (!isListOpen) return;
        repositionPlaylist();
        window.addEventListener("resize", repositionPlaylist);
        window.addEventListener("scroll", repositionPlaylist, true);
        return () => {
            window.removeEventListener("resize", repositionPlaylist);
            window.removeEventListener("scroll", repositionPlaylist, true);
        };
    }, [isListOpen, playlist.length, repositionPlaylist]);

    useEffect(() => {
        if (!isListOpen) return;
        const rafId = requestAnimationFrame(() => {
            itemRefs.current
                .get(player.currentIndex)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return () => cancelAnimationFrame(rafId);
    }, [isListOpen, player.currentIndex]);

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

    // 面板外观由 .playlist-dropdown CSS 统一；这里只拼内容结构
    const playlistPanel = (
        <>
            <div className="playlist-dropdown__header">
                <span>
                    {t("PLAYLIST_TITLE")} [{playlist.length}]
                </span>
                <button
                    type="button"
                    onClick={closePlaylist}
                    className="hover:text-theme-primary cursor-pointer"
                    aria-label={t("CLOSE_PLAYLIST")}
                    title={t("CLOSE_PLAYLIST")}
                >
                    <i className="ri-close-line"></i>
                </button>
            </div>
            <ul
                className="playlist-dropdown__list"
                style={{ scrollbarGutter: "stable" }}
            >
                {playlist.map((song, index) => (
                    <li
                        key={song.id || song.url || index}
                        ref={(el) => {
                            if (el) itemRefs.current.set(index, el);
                            else itemRefs.current.delete(index);
                        }}
                        className={`border-b border-theme-highlight/5 last:border-0 ${index === player.currentIndex ? "text-theme-primary bg-theme-primary/5" : "text-theme-text"}`}
                    >
                        <button
                            type="button"
                            className="flex w-full items-center p-2 hover:bg-theme-highlight/10 cursor-pointer text-ui-xs text-left bg-transparent border-0"
                            onClick={() => {
                                player.playTrack(index, true);
                            }}
                            aria-current={
                                index === player.currentIndex
                                    ? "true"
                                    : undefined
                            }
                            aria-label={
                                song.artist
                                    ? `${song.name} — ${song.artist}`
                                    : song.name
                            }
                        >
                            <span className="w-6 text-theme-dim font-ui-mono">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="flex-1 truncate mr-2">
                                {song.name}
                            </span>
                            <span className="text-theme-dim truncate max-w-[var(--size-track-meta)] text-right">
                                {song.artist}
                            </span>
                            {index === player.currentIndex && (
                                <i className="ri-volume-up-line ml-2 animate-pulse"></i>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );

    return (
        <div ref={rootRef} className="flex flex-col h-full w-full relative">
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
                onPlaylistToggle={togglePlaylist}
                playlistOpen={isListOpen}
                playlistPanelId={playlistPanelId}
            />

            {supportsPopoverApi() ? (
                <div
                    id={playlistPanelId}
                    ref={popoverRef}
                    popover="auto"
                    className="playlist-dropdown"
                >
                    {playlistPanel}
                </div>
            ) : (
                isListOpen && (
                    <div
                        id={playlistPanelId}
                        ref={popoverRef}
                        className="playlist-dropdown fixed z-50"
                    >
                        {playlistPanel}
                    </div>
                )
            )}
        </div>
    );
};

export default MusicPlayer;
