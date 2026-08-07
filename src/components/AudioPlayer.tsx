import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { STORAGE_KEYS, TOAST_DURATION_MS } from "../constants";
import { useLocalPlayer } from "../hooks/useLocalPlayer";
import { useModalA11y } from "../hooks/useModalA11y";
import { AudioMode, Language, PlayMode } from "../types";
import { useTranslation } from "../utils/i18n";
import MessageDisplay from "./MessageDisplay";
import MusicPlayer from "./MusicPlayer";
import PlayerInterface from "./PlayerInterface";
import { Panel } from "./ui";

const AudioPlayer: React.FC<{
    language: Language;
    musicConfig: { server: string; type: string; id: string };
    isOnline: boolean;
}> = ({ language, musicConfig, isOnline }) => {
    const t = useTranslation(language);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

    // 音频源模式：'local' 本地文件 | 'online' 在线音乐
    // 优先从 localStorage 读取，如果没有则默认为 'online'
    const [audioSource, setAudioSource] = useState<"local" | "online">(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.AUDIO_SOURCE);
        return saved === "local" || saved === "online" ? saved : "online";
    });

    // 使用本地播放器 hook
    const localPlayer = useLocalPlayer(audioSource === "local");

    // 切换音频源或播放列表变化时清理 itemRefs
    useEffect(() => {
        itemRefs.current.clear();
    }, [audioSource, localPlayer.playlist]);

    // 持久化音频源选择
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.AUDIO_SOURCE, audioSource);
    }, [audioSource]);

    // Toast 提示状态
    const [showOnlineToast, setShowOnlineToast] = useState(false);
    const prevOnlineRef = useRef(isOnline);

    // 离线时自动切换到本地模式，在线时显示提示
    useEffect(() => {
        let timer: number | null = null;

        if (!isOnline && audioSource === "online") {
            queueMicrotask(() => setAudioSource("local"));
        } else if (
            isOnline &&
            !prevOnlineRef.current &&
            audioSource === "local"
        ) {
            queueMicrotask(() => setShowOnlineToast(true));
            timer = window.setTimeout(
                () => setShowOnlineToast(false),
                TOAST_DURATION_MS,
            );
        }

        prevOnlineRef.current = isOnline;

        return () => {
            if (timer !== null) {
                clearTimeout(timer);
            }
        };
    }, [isOnline, audioSource]);

    const [showPlaylist, setShowPlaylist] = useState(false);
    const playlistModalRef = useRef<HTMLDivElement>(null);
    const closePlaylist = useCallback(() => setShowPlaylist(false), []);
    useModalA11y(showPlaylist, closePlaylist, playlistModalRef);

    // 当播放列表打开或当前索引变化时，滚动到当前项
    useEffect(() => {
        if (showPlaylist && localPlayer.currentIndex >= 0) {
            const rafId = requestAnimationFrame(() => {
                const itemEl = itemRefs.current.get(localPlayer.currentIndex);
                if (itemEl) {
                    itemEl.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [showPlaylist, localPlayer.currentIndex]);

    // 网络恢复按钮回调
    const handleSwitchToOnline = useCallback(() => {
        setShowOnlineToast(false);
        setAudioSource("online");
    }, []);

    // 网络恢复提示的 actionButton
    const onlineToastActionButton = useMemo(
        () => ({
            textKey: "SWITCH_TO_ONLINE" as const,
            onClick: handleSwitchToOnline,
        }),
        [handleSwitchToOnline],
    );

    // 映射 PlayMode 到 AudioMode
    const mapPlayMode = (mode: PlayMode): AudioMode => {
        switch (mode) {
            case PlayMode.SEQUENCE:
                return AudioMode.SEQUENTIAL;
            case PlayMode.LOOP:
                return AudioMode.REPEAT_ONE;
            case PlayMode.RANDOM:
                return AudioMode.SHUFFLE;
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
            className="p-6 h-full min-h-[14rem] relative"
            title={
                <div className="flex items-center justify-between w-full">
                    <span>{t("AUDIO_MODULE")}</span>
                    <button
                        onClick={() => {
                            if (!isOnline && audioSource === "local") return;
                            setAudioSource((prev) =>
                                prev === "local" ? "online" : "local",
                            );
                        }}
                        className={`px-2 py-0.5 text-ui-2xs font-ui-mono border transition-colors rounded-sm uppercase tracking-ui-wider ${
                            !isOnline && audioSource === "local"
                                ? "border-theme-highlight/30 text-theme-dim/50 cursor-not-allowed"
                                : "border-theme-highlight/50 text-theme-dim hover:text-theme-primary hover:border-theme-primary cursor-pointer"
                        }`}
                        title={
                            !isOnline && audioSource === "local"
                                ? t("OFFLINE_MODE_ONLY")
                                : audioSource === "local"
                                  ? t("SWITCH_TO_ONLINE")
                                  : t("SWITCH_TO_LOCAL")
                        }
                        disabled={!isOnline && audioSource === "local"}
                    >
                        {audioSource === "local"
                            ? `⇄ ${t("ONLINE_MODE")}`
                            : `⇄ ${t("LOCAL_MODE")}`}
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

            {audioSource === "online" ? (
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
                        currentTrackName={
                            localPlayer.currentTrack?.name ?? null
                        }
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
                    {showPlaylist &&
                        createPortal(
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
                                <div
                                    className="absolute inset-0"
                                    onClick={closePlaylist}
                                ></div>

                                <div
                                    ref={playlistModalRef}
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="local-playlist-title"
                                    tabIndex={-1}
                                    className="w-full max-w-lg bg-theme-base/95 border border-theme-primary/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[80vh] backdrop-blur-xl z-10 outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between p-4 border-b border-theme-highlight bg-theme-surface/50">
                                        <h3
                                            id="local-playlist-title"
                                            className="font-ui-mono text-ui-sm uppercase text-theme-primary tracking-ui-widest"
                                        >
                                            {t("PLAYLIST_TITLE")}
                                        </h3>
                                        <button
                                            onClick={closePlaylist}
                                            className="text-theme-dim hover:text-theme-primary p-1 cursor-pointer"
                                            aria-label={t("CLOSE_PLAYLIST")}
                                            title={t("CLOSE_PLAYLIST")}
                                        >
                                            <i className="ri-close-line icon-ui-xl"></i>
                                        </button>
                                    </div>

                                    <div
                                        className="overflow-y-auto p-2 custom-scrollbar flex-1 bg-black/20"
                                        style={{ scrollbarGutter: "stable" }}
                                    >
                                        {localPlayer.playlist.length === 0 ? (
                                            <div className="text-center p-8 text-theme-dim font-ui-mono text-ui-xs">
                                                {t("NO_TRACK")}
                                            </div>
                                        ) : (
                                            <ul className="space-y-1">
                                                {localPlayer.playlist.map(
                                                    (track, idx) => (
                                                        <li
                                                            key={track.id}
                                                            ref={(el) => {
                                                                if (el)
                                                                    itemRefs.current.set(
                                                                        idx,
                                                                        el,
                                                                    );
                                                                else
                                                                    itemRefs.current.delete(
                                                                        idx,
                                                                    );
                                                            }}
                                                            className={`flex items-start p-3 border border-transparent hover:bg-theme-highlight/20 hover:border-theme-highlight/50 transition-all duration-200 group ${idx === localPlayer.currentIndex ? "bg-theme-primary/10 border-theme-primary/30" : ""}`}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="flex items-start flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
                                                                onClick={() =>
                                                                    localPlayer.playTrack(
                                                                        idx,
                                                                        true,
                                                                    )
                                                                }
                                                                aria-current={
                                                                    idx ===
                                                                    localPlayer.currentIndex
                                                                        ? "true"
                                                                        : undefined
                                                                }
                                                                aria-label={
                                                                    track.artist
                                                                        ? `${track.name} — ${track.artist}`
                                                                        : track.name
                                                                }
                                                            >
                                                                <div
                                                                    className={`w-8 font-ui-mono text-ui-xs pt-0.5 flex-shrink-0 ${idx === localPlayer.currentIndex ? "text-theme-primary font-bold" : "text-theme-dim"}`}
                                                                >
                                                                    {(idx + 1)
                                                                        .toString()
                                                                        .padStart(
                                                                            2,
                                                                            "0",
                                                                        )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div
                                                                        className={`font-ui-mono text-ui-sm truncate ${idx === localPlayer.currentIndex ? "text-theme-primary" : "text-theme-text group-hover:text-theme-primary"}`}
                                                                    >
                                                                        {
                                                                            track.name
                                                                        }
                                                                    </div>
                                                                    {track.artist && (
                                                                        <div className="font-ui-mono text-ui-xs text-theme-dim truncate mt-0.5">
                                                                            {
                                                                                track.artist
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {idx ===
                                                                    localPlayer.currentIndex &&
                                                                    localPlayer.isPlaying && (
                                                                        <span className="text-ui-xs text-theme-primary animate-pulse ml-2 flex items-center flex-shrink-0">
                                                                            <i className="ri-rhythm-line icon-ui-md"></i>
                                                                        </span>
                                                                    )}
                                                            </button>
                                                            <button
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    localPlayer.removeTrack(
                                                                        idx,
                                                                    );
                                                                }}
                                                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-theme-dim hover:text-red-500 transition-all px-2 flex-shrink-0 self-center cursor-pointer"
                                                                title={t(
                                                                    "DELETE_TRACK",
                                                                )}
                                                                aria-label={`${t("DELETE_TRACK")}: ${track.artist ? `${track.name} — ${track.artist}` : track.name}`}
                                                            >
                                                                <i className="ri-close-line icon-ui-lg"></i>
                                                            </button>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-theme-highlight bg-theme-surface/50 flex justify-end gap-3">
                                        <div className="text-ui-micro text-theme-dim self-center mr-auto">
                                            {localPlayer.playlist.length}{" "}
                                            {t("FILES_LOADED")}
                                            <div className="text-ui-2xs">
                                                {t("DUPLICATE_SKIP_HINT")}
                                            </div>
                                        </div>
                                        <button
                                            onClick={localPlayer.clearPlaylist}
                                            className="text-ui-xs font-ui-mono px-3 py-1 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                            disabled={
                                                localPlayer.playlist.length ===
                                                0
                                            }
                                        >
                                            {t("CLEAR")}
                                        </button>
                                        <button
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="text-ui-xs font-ui-mono border border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-black px-4 py-1 transition-all uppercase flex items-center gap-1 cursor-pointer"
                                        >
                                            <i className="ri-add-line icon-ui-md"></i>
                                            {t("ADD_TRACKS")}
                                        </button>
                                    </div>
                                </div>
                            </div>,
                            document.body,
                        )}
                </>
            )}
        </Panel>
    );
};

export default AudioPlayer;
