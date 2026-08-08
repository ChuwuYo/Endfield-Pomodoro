import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import type { MusicConfig } from "../config/musicConfig";
import { TRACK_FIX_FAILURE_LIMIT } from "../constants";
import { type MusicTrack, useMusicData } from "../hooks/useMusicData";
import { useOnlinePlayer } from "../hooks/useOnlinePlayer";
import { Language, MusicDataError } from "../types";
import { useTranslation } from "../utils/i18n";
import { applyAnchoredPopoverPlacement } from "../utils/placeAnchoredPopover";
import {
    PLAYLIST_MAX_HEIGHT_CAP_DESIGN_PX,
    PLAYLIST_MIN_HEIGHT_DESIGN_PX,
    PLAYLIST_POSITIONED_CLASS,
} from "../utils/playlistPopoverLayout";
import { isPlaylistPopoverMountReady } from "../utils/playlistPopoverMount";
import { shouldRestoreFocusAfterPopoverClose } from "../utils/popoverFocus";
import MessageDisplay from "./MessageDisplay";
import PlayerInterface from "./PlayerInterface";

interface MusicPlayerProps {
    config: MusicConfig;
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
    const positionRafRef = useRef<number | null>(null);
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
            // 以原始 url 作为覆盖键：它必然存在且唯一，不依赖上游是否返回 id
            url: urlOverrides[item.url] || item.url,
            cover: item.cover,
            lrc: item.lrc,
        }));
    }, [metingData, urlOverrides]);

    /** 记录一次单曲回退失败；连续失败足够多次就整单切换数据源 */
    const registerTrackFixFailure = useCallback((): null => {
        errorCountRef.current += 1;

        if (errorCountRef.current >= TRACK_FIX_FAILURE_LIMIT) {
            console.warn(
                "[MusicPlayer] Playlist playback failed consistently, switching to next API adapter for entire playlist...",
            );
            setUrlOverrides({});
            retryWithNextAdapter();
            errorCountRef.current = 0;
        }

        return null;
    }, [retryWithNextAdapter]);

    const handleTrackFix = useCallback(
        async (index: number): Promise<string | null> => {
            if (trackFixAbortRef.current) {
                trackFixAbortRef.current.abort();
            }
            const controller = new AbortController();
            trackFixAbortRef.current = controller;

            const track = metingData[index];
            if (!track) return null;

            // 缺少 id/url 时无法做单曲回退，但这依然是一次播放失败：
            // 必须计入，否则整单切换数据源的降级路径永远不会触发
            if (!track.id || !track.url) {
                return registerTrackFixFailure();
            }

            const newUrl = await fetchTrackUrl(track.id, controller.signal);

            if (controller.signal.aborted) return null;

            if (newUrl) {
                errorCountRef.current = 0;
                setUrlOverrides((prev) => ({
                    ...prev,
                    [track.url]: newUrl,
                }));
                return newUrl;
            }

            console.warn(
                `[MusicPlayer] Track fallback failed for: ${track.name}`,
            );

            return registerTrackFixFailure();
        },
        [metingData, fetchTrackUrl, registerTrackFixFailure],
    );

    // 切换适配器会重新拉取歌单，此时界面已切到 CONNECTING；
    // 一并停掉音频，避免出现「显示正在连接、却还在播放旧数据源」的状态分裂
    const player = useOnlinePlayer(
        playlist,
        false,
        enabled && !dataLoading,
        handleTrackFix,
    );

    const applyPlaylistPlacement = useCallback(() => {
        const popover = popoverRef.current;
        const anchor = rootRef.current;
        if (!popover || !anchor) return;
        applyAnchoredPopoverPlacement(popover, anchor, {
            gap: 8,
            padding: 16,
            minHeight: PLAYLIST_MIN_HEIGHT_DESIGN_PX,
            maxHeightCap: PLAYLIST_MAX_HEIGHT_CAP_DESIGN_PX,
        });
    }, []);

    const clearPlaylistPositioned = useCallback(() => {
        if (positionRafRef.current != null) {
            cancelAnimationFrame(positionRafRef.current);
            positionRafRef.current = null;
        }
        popoverRef.current?.classList.remove(PLAYLIST_POSITIONED_CLASS);
    }, []);

    /** 先定位再显示，避免首帧闪左上角（visibility + is-positioned） */
    const revealPlaylistPlacement = useCallback(() => {
        const popover = popoverRef.current;
        if (!popover) return;
        popover.classList.remove(PLAYLIST_POSITIONED_CLASS);
        applyPlaylistPlacement();
        if (positionRafRef.current != null) {
            cancelAnimationFrame(positionRafRef.current);
        }
        // 一帧后再显示：盖掉 UA 打开时可能写回的默认 inset
        positionRafRef.current = requestAnimationFrame(() => {
            positionRafRef.current = null;
            applyPlaylistPlacement();
            popover.classList.add(PLAYLIST_POSITIONED_CLASS);
        });
    }, [applyPlaylistPlacement]);

    const restorePlaylistFocus = useCallback(() => {
        queueMicrotask(() => {
            const popover = popoverRef.current;
            const active = document.activeElement;
            // 点外部关：焦点已在其它控件上 → 不抢；body / 面板内关闭 → 归还触发器
            if (!shouldRestoreFocusAfterPopoverClose(popover, active)) {
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
        clearPlaylistPositioned();
        setIsListOpen(false);
        restorePlaylistFocus();
    }, [clearPlaylistPositioned, restorePlaylistFocus]);

    const togglePlaylist = useCallback(() => {
        const el = popoverRef.current;
        if (el && supportsPopoverApi()) {
            el.togglePopover();
            return;
        }
        // 无 Popover：触发按钮点击切换；焦点已在按钮上，无需副作用恢复
        setIsListOpen((open) => !open);
    }, []);

    // loading/error/empty early-return 时 popover 不在 DOM；必须等就绪后再绑 toggle
    const playlistUiReady = isPlaylistPopoverMountReady(
        dataLoading,
        Boolean(dataError),
        Boolean(player.currentSong),
    );

    // popovertarget / showPopover 的开关同步到 React（含 Esc、点外部）
    useEffect(() => {
        if (!playlistUiReady) return;
        const el = popoverRef.current;
        if (!el || !supportsPopoverApi()) return;

        const syncOpen = (open: boolean) => {
            setIsListOpen(open);
            if (open) {
                revealPlaylistPlacement();
            } else {
                clearPlaylistPositioned();
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
        return () => {
            el.removeEventListener("toggle", onToggle);
            clearPlaylistPositioned();
        };
    }, [
        playlistUiReady,
        revealPlaylistPlacement,
        clearPlaylistPositioned,
        restorePlaylistFocus,
    ]);

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

    // 打开后跟随锚点；resize/scroll 时重算（下方不够 5 行则 flip）
    useEffect(() => {
        if (!isListOpen) return;
        if (!supportsPopoverApi()) {
            revealPlaylistPlacement();
        } else {
            applyPlaylistPlacement();
        }
        const onReposition = () => {
            applyPlaylistPlacement();
            popoverRef.current?.classList.add(PLAYLIST_POSITIONED_CLASS);
        };
        window.addEventListener("resize", onReposition);
        window.addEventListener("scroll", onReposition, true);
        return () => {
            window.removeEventListener("resize", onReposition);
            window.removeEventListener("scroll", onReposition, true);
        };
    }, [
        isListOpen,
        playlist.length,
        applyPlaylistPlacement,
        revealPlaylistPlacement,
    ]);

    useEffect(() => {
        if (!isListOpen) return;
        const rafId = requestAnimationFrame(() => {
            itemRefs.current
                .get(player.currentIndex)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return () => cancelAnimationFrame(rafId);
    }, [isListOpen, player.currentIndex]);

    if (dataLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <MessageDisplay messageKey="CONNECTING" language={language} />
            </div>
        );
    }

    if (dataError) {
        // 歌单不存在/私密与服务故障是两回事，提示不同才能指导用户下一步
        const isPlaylistProblem =
            dataError === MusicDataError.PLAYLIST_UNAVAILABLE;
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
                <i
                    className={`${isPlaylistProblem ? "ri-play-list-line" : "ri-error-warning-line"} icon-ui-xl mb-1`}
                ></i>
                <div className="text-ui-xs font-ui-mono">
                    {t(
                        isPlaylistProblem
                            ? "PLAYLIST_UNAVAILABLE"
                            : "CONNECTION_LOST",
                    )}
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
                playMode={player.playMode}
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
