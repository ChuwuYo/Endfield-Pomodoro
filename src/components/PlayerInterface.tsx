import React, { useEffect, useRef, useState } from "react";
import { SECONDS_PER_MINUTE } from "../constants";
import { AudioMode, Language } from "../types";
import { useTranslation } from "../utils/i18n";

export interface PlayerInterfaceProps {
    // 状态
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    currentTrackName: string | null;
    currentArtist?: string;
    coverUrl?: string;
    playlistCount: number;
    currentIndex: number;
    playMode: AudioMode;
    language: Language;
    isLoading?: boolean;

    // 回调
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onModeToggle: () => void;
    onPlaylistToggle: () => void;
    playlistOpen?: boolean;
    playlistPanelId?: string;
}

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(value, max));

const VOLUME_STEP = 0.05;

const supportsPopoverApi = () =>
    typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

const PlayerInterface: React.FC<PlayerInterfaceProps> = ({
    isPlaying,
    currentTime,
    duration,
    volume,
    currentTrackName,
    currentArtist,
    coverUrl,
    playlistCount,
    currentIndex,
    playMode,
    language,
    isLoading = false,
    onPlayPause,
    onNext,
    onPrev,
    onSeek,
    onVolumeChange,
    onModeToggle,
    onPlaylistToggle,
    playlistOpen = false,
    playlistPanelId,
}) => {
    const t = useTranslation(language);
    const isDraggingRef = useRef(false);
    const isVolumeDraggingRef = useRef(false);
    const previousVolumeRef = useRef<number>(0.5);
    const [dragTime, setDragTime] = useState<number | null>(null);
    const [dragVolume, setDragVolume] = useState<number | null>(null);
    const [displayCoverUrl, setDisplayCoverUrl] = useState<string | undefined>(
        coverUrl,
    );
    const coverLoadIdRef = useRef(0);

    const onSeekRef = useRef(onSeek);
    const onVolumeChangeRef = useRef(onVolumeChange);
    const durationRef = useRef(duration);

    useEffect(() => {
        onSeekRef.current = onSeek;
    }, [onSeek]);
    useEffect(() => {
        onVolumeChangeRef.current = onVolumeChange;
    }, [onVolumeChange]);
    useEffect(() => {
        durationRef.current = duration;
    }, [duration]);

    useEffect(() => {
        if (!coverUrl || coverUrl === displayCoverUrl) return;

        const loadId = ++coverLoadIdRef.current;
        const img = new Image();
        img.onload = () => {
            if (coverLoadIdRef.current === loadId) {
                setDisplayCoverUrl(coverUrl);
            }
        };
        img.src = coverUrl;
    }, [coverUrl, displayCoverUrl]);

    useEffect(() => {
        if (volume > 0) {
            previousVolumeRef.current = volume;
        }
    }, [volume]);

    const formatTime = (seconds: number) => {
        if (!Number.isFinite(seconds)) return "00:00";
        const mins = Math.floor(seconds / SECONDS_PER_MINUTE);
        const secs = Math.floor(seconds % SECONDS_PER_MINUTE);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const hasFiniteDuration = Number.isFinite(duration) && duration > 0;
    const safeCurrentTime = Number.isFinite(currentTime) ? currentTime : 0;

    const getProgressStep = () => {
        const d = durationRef.current;
        return Number.isFinite(d) && d > 0 ? Math.max(5, d * 0.01) : 5;
    };

    const updateProgressFromPointer = (
        clientX: number,
        element: HTMLDivElement,
    ) => {
        const d = durationRef.current;
        if (!Number.isFinite(d) || d <= 0) return;
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0) return;
        const clickX = clamp(clientX - rect.left, 0, rect.width);
        setDragTime((clickX / rect.width) * d);
    };

    const updateVolumeFromPointer = (
        clientX: number,
        element: HTMLDivElement,
    ) => {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0) return;
        const clickX = clamp(clientX - rect.left, 0, rect.width);
        setDragVolume(clamp(clickX / rect.width, 0, 1));
    };

    const finishProgressDrag = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setDragTime((prev) => {
            if (prev !== null && Number.isFinite(prev)) onSeekRef.current(prev);
            return null;
        });
    };

    const finishVolumeDrag = () => {
        if (!isVolumeDraggingRef.current) return;
        isVolumeDraggingRef.current = false;
        setDragVolume((prev) => {
            if (prev !== null) onVolumeChangeRef.current(prev);
            return null;
        });
    };

    const handleProgressPointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (e.button !== 0) return;
        const d = durationRef.current;
        if (!Number.isFinite(d) || d <= 0) return;
        e.preventDefault();
        e.currentTarget.focus();
        isDraggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateProgressFromPointer(e.clientX, e.currentTarget);
    };

    const handleProgressPointerMove = (
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (!isDraggingRef.current) return;
        e.preventDefault();
        updateProgressFromPointer(e.clientX, e.currentTarget);
    };

    const handleProgressPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        finishProgressDrag();
    };

    const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!hasFiniteDuration) return;
        const step = getProgressStep();
        switch (e.key) {
            case "ArrowLeft":
            case "ArrowDown":
                e.preventDefault();
                onSeek(clamp(safeCurrentTime - step, 0, duration));
                break;
            case "ArrowRight":
            case "ArrowUp":
                e.preventDefault();
                onSeek(clamp(safeCurrentTime + step, 0, duration));
                break;
            case "Home":
                e.preventDefault();
                onSeek(0);
                break;
            case "End":
                e.preventDefault();
                onSeek(duration);
                break;
        }
    };

    const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.focus();
        isVolumeDraggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateVolumeFromPointer(e.clientX, e.currentTarget);
    };

    const handleVolumePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isVolumeDraggingRef.current) return;
        e.preventDefault();
        updateVolumeFromPointer(e.clientX, e.currentTarget);
    };

    const handleVolumePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        finishVolumeDrag();
    };

    const handleVolumeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case "ArrowLeft":
            case "ArrowDown":
                e.preventDefault();
                onVolumeChange(clamp(volume - VOLUME_STEP, 0, 1));
                break;
            case "ArrowRight":
            case "ArrowUp":
                e.preventDefault();
                onVolumeChange(clamp(volume + VOLUME_STEP, 0, 1));
                break;
            case "Home":
                e.preventDefault();
                onVolumeChange(0);
                break;
            case "End":
                e.preventDefault();
                onVolumeChange(1);
                break;
        }
    };

    const displayTime = dragTime !== null ? dragTime : safeCurrentTime;
    const displayVolume = dragVolume !== null ? dragVolume : volume;
    const renderedCoverUrl = coverUrl ? displayCoverUrl : undefined;
    const progressValueNow = Math.round(
        Number.isFinite(displayTime) ? displayTime : 0,
    );
    const volumeValueNow = Math.round(displayVolume * 100);

    return (
        <div className="flex flex-col h-full w-full relative gap-3">
            {/* 主要显示区域 */}
            <div className="flex-1 min-h-0 flex flex-col justify-start">
                {/* 顶部信息栏 */}
                <div className="flex justify-between items-end border-b border-theme-highlight/30 pb-2 mb-2">
                    <div className="flex flex-col overflow-hidden mr-4 flex-1">
                        <span className="text-ui-micro text-theme-dim uppercase tracking-ui-widest">
                            {isLoading ? t("CONNECTING") : t("STATUS")}
                        </span>
                        {currentTrackName ? (
                            <div className="flex flex-col mt-1">
                                <div className="text-ui-sm font-ui-mono text-theme-primary truncate animate-pulse-fast leading-ui-tight">
                                    {isPlaying ? "► " : "❚❚ "}{" "}
                                    {currentTrackName}
                                </div>
                                {currentArtist && (
                                    <div className="text-ui-xs text-theme-dim truncate leading-ui-tight mt-0.5">
                                        {currentArtist}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-ui-sm font-ui-mono text-theme-dim uppercase leading-ui-tight mt-1">
                                {t("NO_TRACK")}
                            </div>
                        )}
                    </div>
                    <div className="text-ui-micro font-ui-mono text-theme-dim text-right shrink-0">
                        {playlistCount > 0
                            ? `${currentIndex + 1} / ${playlistCount}`
                            : "- / -"}
                    </div>
                </div>

                {/* 中间：封面(可选) + 进度条 + 播放列表按钮 + 模式 */}
                <div className="flex items-center gap-3">
                    {/* 封面 */}
                    {renderedCoverUrl && (
                        <div
                            className="w-12 h-12 rounded-full border border-theme-primary/30 bg-cover bg-center shrink-0 animate-spin-slow"
                            style={{
                                backgroundImage: `url(${renderedCoverUrl})`,
                                animationPlayState: isPlaying
                                    ? "running"
                                    : "paused",
                            }}
                        ></div>
                    )}

                    {/* 块进度条 */}
                    <div className="flex-1 flex items-center justify-center px-2">
                        <div className="relative w-full h-12">
                            {/* 进度轨道 */}
                            <div
                                role="slider"
                                tabIndex={hasFiniteDuration ? 0 : -1}
                                aria-disabled={!hasFiniteDuration}
                                aria-label={t("PROGRESS_SLIDER")}
                                aria-valuemin={0}
                                aria-valuemax={
                                    hasFiniteDuration ? Math.round(duration) : 0
                                }
                                aria-valuenow={
                                    hasFiniteDuration ? progressValueNow : 0
                                }
                                aria-valuetext={
                                    hasFiniteDuration
                                        ? `${formatTime(displayTime)} / ${formatTime(duration)}`
                                        : undefined
                                }
                                className="absolute inset-0 bg-theme-highlight/20 border border-theme-highlight/50 clip-path-slant cursor-pointer overflow-hidden touch-none"
                                style={{ touchAction: "none" }}
                                onPointerDown={handleProgressPointerDown}
                                onPointerMove={handleProgressPointerMove}
                                onPointerUp={handleProgressPointerUp}
                                onPointerCancel={handleProgressPointerUp}
                                onKeyDown={handleProgressKeyDown}
                            >
                                {/* 进度填充 */}
                                {hasFiniteDuration &&
                                    displayTime / duration > 0.01 && (
                                        <div
                                            className="h-full bg-theme-primary/80 relative pointer-events-none"
                                            style={{
                                                width: `${(displayTime / duration) * 100}%`,
                                                filter: "drop-shadow(0 0 4px rgba(var(--color-primary), 0.6))",
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/20 to-transparent animate-pulse-fast"></div>
                                        </div>
                                    )}
                            </div>

                            {/* 时间显示覆盖层 */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="flex items-center gap-2 px-2 bg-black/60 backdrop-blur-sm rounded">
                                    <span
                                        className="text-ui-micro md:text-ui-xs font-ui-mono text-white font-bold"
                                        style={{
                                            textShadow:
                                                "0 1px 2px rgba(0,0,0,0.8)",
                                        }}
                                    >
                                        {formatTime(displayTime)}
                                    </span>
                                    <span className="text-ui-3xs md:text-ui-2xs font-ui-mono text-white/70">
                                        /
                                    </span>
                                    <span className="text-ui-3xs md:text-ui-2xs font-ui-mono text-white/70">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 显示播放列表按钮 */}
                    <button
                        type="button"
                        onClick={
                            playlistPanelId && supportsPopoverApi()
                                ? undefined
                                : onPlaylistToggle
                        }
                        {...(playlistPanelId && supportsPopoverApi()
                            ? {
                                  popoverTarget: playlistPanelId,
                                  popoverTargetAction: "toggle" as const,
                              }
                            : {})}
                        className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-primary hover:border-theme-primary transition-colors rounded-sm cursor-pointer"
                        title={t("PLAYLIST_BUTTON")}
                        aria-label={t("PLAYLIST_BUTTON")}
                        aria-expanded={playlistOpen}
                        aria-controls={playlistPanelId}
                    >
                        <i className="ri-play-list-line icon-ui-md"></i>
                    </button>

                    {/* 模式切换 */}
                    <button
                        onClick={onModeToggle}
                        className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-primary hover:border-theme-primary transition-colors rounded-sm cursor-pointer"
                        title={
                            playMode === AudioMode.SEQUENTIAL
                                ? t("MODE_SEQ")
                                : playMode === AudioMode.REPEAT_ONE
                                  ? t("MODE_REPEAT_ONE")
                                  : t("MODE_SHUFFLE")
                        }
                        aria-label={t("TOGGLE_MODE")}
                    >
                        {playMode === AudioMode.SEQUENTIAL ? (
                            <i className="ri-repeat-line icon-ui-md"></i>
                        ) : playMode === AudioMode.REPEAT_ONE ? (
                            <i className="ri-repeat-one-line icon-ui-md"></i>
                        ) : (
                            <i className="ri-shuffle-line icon-ui-md"></i>
                        )}
                    </button>
                </div>
            </div>

            {/* 底部控制 */}
            <div className="flex items-center justify-between gap-3 shrink-0">
                {/* 上一曲目 */}
                <button
                    onClick={onPrev}
                    disabled={playlistCount === 0}
                    className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={t("PREVIOUS_TRACK_TOOLTIP")}
                    aria-label={t("PREVIOUS_TRACK_TOOLTIP")}
                >
                    <i className="ri-skip-back-line icon-ui-xl"></i>
                </button>

                {/* 播放/暂停 */}
                <button
                    onClick={onPlayPause}
                    disabled={playlistCount === 0}
                    className={`w-14 h-9 flex items-center justify-center border transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${isPlaying ? "bg-theme-primary text-black border-theme-primary" : "border-theme-highlight text-theme-text hover:border-theme-primary"}`}
                    title={t("PLAY_PAUSE")}
                    aria-label={t("PLAY_PAUSE")}
                >
                    {isPlaying ? (
                        <i className="ri-pause-line icon-ui-2xl"></i>
                    ) : (
                        <i className="ri-play-fill icon-ui-2xl"></i>
                    )}
                </button>

                {/* 下一曲目 */}
                <button
                    onClick={onNext}
                    disabled={playlistCount === 0}
                    className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title={t("NEXT_TRACK")}
                    aria-label={t("NEXT_TRACK")}
                >
                    <i className="ri-skip-forward-line icon-ui-xl"></i>
                </button>

                {/* 音量条 */}
                <div className="flex-1 h-9 flex items-center gap-2 px-2 border border-theme-highlight/30 rounded-sm bg-black/10">
                    <i
                        className={`${displayVolume === 0 ? "ri-volume-mute-line" : "ri-volume-up-line"} icon-ui-md text-theme-dim hover:text-theme-primary shrink-0 cursor-pointer transition-colors`}
                        role="button"
                        aria-label={
                            displayVolume === 0 ? t("UNMUTE") : t("MUTE")
                        }
                        tabIndex={0}
                        onClick={() => {
                            if (displayVolume === 0) {
                                onVolumeChange(
                                    previousVolumeRef.current || 0.5,
                                );
                            } else {
                                previousVolumeRef.current = displayVolume;
                                onVolumeChange(0);
                            }
                        }}
                    ></i>
                    <div
                        role="slider"
                        tabIndex={0}
                        aria-label={t("VOLUME_SLIDER")}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={volumeValueNow}
                        aria-valuetext={`${volumeValueNow}%`}
                        className="w-full h-4 flex items-center relative group cursor-pointer touch-none"
                        style={{ touchAction: "none" }}
                        onPointerDown={handleVolumePointerDown}
                        onPointerMove={handleVolumePointerMove}
                        onPointerUp={handleVolumePointerUp}
                        onPointerCancel={handleVolumePointerUp}
                        onKeyDown={handleVolumeKeyDown}
                    >
                        <div className="w-full h-1 bg-theme-highlight/30 relative rounded-full pointer-events-none">
                            <div
                                className="h-full bg-theme-dim group-hover:bg-theme-primary transition-colors relative"
                                style={{ width: `${displayVolume * 100}%` }}
                            ></div>
                        </div>
                        {/* 可拖拽的圆球滑块 */}
                        <div
                            className="absolute w-3 h-3 bg-theme-primary rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform group-hover:scale-125 pointer-events-none"
                            style={{
                                left: `${displayVolume * 100}%`,
                                transform: "translateX(-50%)",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerInterface;
