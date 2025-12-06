import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '../utils/i18n';
import { Language, AudioMode } from '../types';
import { SECONDS_PER_MINUTE } from '../constants';

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
}

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
    onPlaylistToggle
}) => {
    const t = useTranslation(language);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const isVolumeDraggingRef = useRef(false);
    const previousVolumeRef = useRef<number>(0.5);
    const [dragTime, setDragTime] = useState<number | null>(null);
    const [dragVolume, setDragVolume] = useState<number | null>(null);

    // 用 ref 保存回调和 duration，避免事件监听器频繁重建
    const onSeekRef = useRef(onSeek);
    const onVolumeChangeRef = useRef(onVolumeChange);
    const durationRef = useRef(duration);

    useEffect(() => { onSeekRef.current = onSeek; }, [onSeek]);
    useEffect(() => { onVolumeChangeRef.current = onVolumeChange; }, [onVolumeChange]);
    useEffect(() => { durationRef.current = duration; }, [duration]);

    // 同步保存非零音量值到 ref
    useEffect(() => {
        if (volume > 0) {
            previousVolumeRef.current = volume;
        }
    }, [volume]);

    // 格式化时间
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
        const mins = Math.floor(seconds / SECONDS_PER_MINUTE);
        const secs = Math.floor(seconds % SECONDS_PER_MINUTE);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // 处理进度条和音量条拖拽
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            e.preventDefault();

            // 进度条拖拽
            if (isDraggingRef.current && progressBarRef.current && durationRef.current > 0) {
                const rect = progressBarRef.current.getBoundingClientRect();
                const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const newTime = (clickX / rect.width) * durationRef.current;
                setDragTime(newTime);
            }

            // 音量条拖拽 - 实时更新
            if (isVolumeDraggingRef.current && volumeBarRef.current) {
                const rect = volumeBarRef.current.getBoundingClientRect();
                const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
                setDragVolume(newVolume);
            }
        };

        const handleGlobalMouseUp = () => {
            // 进度条释放
            if (isDraggingRef.current) {
                // 使用函数式更新获取最新 dragTime
                setDragTime(prev => {
                    if (prev !== null) onSeekRef.current(prev);
                    return null;
                });
            }
            isDraggingRef.current = false;

            // 音量条释放
            if (isVolumeDraggingRef.current) {
                setDragVolume(prev => {
                    if (prev !== null) onVolumeChangeRef.current(prev);
                    return null;
                });
            }
            isVolumeDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []); // 空依赖，只挂载一次

    const displayTime = dragTime !== null ? dragTime : currentTime;
    const displayVolume = dragVolume !== null ? dragVolume : volume;

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* 主要显示区域 */}
            <div className="flex-1 min-h-0 flex flex-col justify-center mb-2">
                {/* 顶部信息栏 */}
                <div className="flex justify-between items-end border-b border-theme-highlight/30 pb-2 mb-2">
                    <div className="flex flex-col overflow-hidden mr-4 flex-1">
                        <span className="text-[10px] text-theme-dim uppercase tracking-widest">
                            {isLoading ? t('CONNECTING') : t('STATUS')}
                        </span>
                        {currentTrackName ? (
                            <div className="flex flex-col mt-1">
                                <div className="text-sm font-mono text-theme-primary truncate animate-pulse-fast leading-tight">
                                    {isPlaying ? '► ' : '❚❚ '} {currentTrackName}
                                </div>
                                {currentArtist && (
                                    <div className="text-xs text-theme-dim truncate leading-tight mt-0.5">
                                        {currentArtist}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm font-mono text-theme-dim uppercase leading-tight mt-1">{t('NO_TRACK')}</div>
                        )}
                    </div>
                    <div className="text-[10px] font-mono text-theme-dim text-right shrink-0">
                        {playlistCount > 0 ? `${currentIndex + 1} / ${playlistCount}` : '- / -'}
                    </div>
                </div>

                {/* 中间：封面(可选) + 进度条 + 播放列表按钮 + 模式 */}
                <div className="flex items-center gap-3">
                    {/* 封面 */}
                    {coverUrl && (
                        <div
                            className="w-12 h-12 rounded-full border border-theme-primary/30 bg-cover bg-center shrink-0 animate-spin-slow"
                            style={{
                                backgroundImage: `url(${coverUrl})`,
                                animationPlayState: isPlaying ? 'running' : 'paused'
                            }}
                        ></div>
                    )}

                    {/* 块进度条 */}
                    <div className="flex-1 flex items-center justify-center px-2">
                        <div className="relative w-full h-12">
                            {/* 进度轨道 */}
                            <div
                                ref={progressBarRef}
                                className="absolute inset-0 bg-theme-highlight/20 border border-theme-highlight/50 clip-path-slant cursor-pointer overflow-hidden"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    isDraggingRef.current = true;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const newTime = (clickX / rect.width) * duration;
                                    setDragTime(newTime);
                                }}
                            >
                                {/* 进度填充 */}
                                {duration > 0 && (displayTime / duration) > 0.01 && (
                                    <div
                                        className="h-full bg-theme-primary/80 relative pointer-events-none"
                                        style={{
                                            width: `${(displayTime / duration) * 100}%`,
                                            filter: 'drop-shadow(0 0 4px rgba(var(--color-primary), 0.6))'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-theme-primary/20 to-transparent animate-pulse-fast"></div>
                                    </div>
                                )}
                            </div>

                            {/* 时间显示覆盖层 */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="flex items-center gap-2 px-2 bg-black/60 backdrop-blur-sm rounded">
                                    <span className="text-[10px] md:text-xs font-mono text-white font-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                        {formatTime(displayTime)}
                                    </span>
                                    <span className="text-[8px] md:text-[9px] font-mono text-white/70">
                                        /
                                    </span>
                                    <span className="text-[8px] md:text-[9px] font-mono text-white/70">
                                        {formatTime(duration)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 显示播放列表按钮 */}
                    <button
                        onClick={onPlaylistToggle}
                        className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-primary hover:border-theme-primary transition-colors rounded-sm"
                        title={t('PLAYLIST_BUTTON')}
                    >
                        <i className="ri-play-list-line text-base"></i>
                    </button>

                    {/* 模式切换 */}
                    <button
                        onClick={onModeToggle}
                        className="p-1.5 border border-theme-dim text-theme-dim hover:text-theme-secondary hover:border-theme-secondary transition-colors rounded-sm flex items-center gap-1"
                        title={playMode === AudioMode.SEQUENTIAL ? t('MODE_SEQ') : playMode === AudioMode.REPEAT_ONE ? t('MODE_REPEAT_ONE') : t('MODE_SHUFFLE')}
                    >
                        {playMode === AudioMode.SEQUENTIAL ? (
                            <i className="ri-repeat-line text-base"></i>
                        ) : playMode === AudioMode.REPEAT_ONE ? (
                            <i className="ri-repeat-one-line text-base"></i>
                        ) : (
                            <i className="ri-shuffle-line text-base"></i>
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
                    className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('PREVIOUS_TRACK_TOOLTIP')}
                >
                    <i className="ri-skip-back-line text-xl"></i>
                </button>

                {/* 播放/暂停 */}
                <button
                    onClick={onPlayPause}
                    disabled={playlistCount === 0}
                    className={`w-14 h-9 flex items-center justify-center border transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed ${isPlaying ? 'bg-theme-primary text-black border-theme-primary' : 'border-theme-highlight text-theme-text hover:border-theme-primary'}`}
                    title={t('PLAY_PAUSE')}
                >
                    {isPlaying ? (
                        <i className="ri-pause-line text-2xl"></i>
                    ) : (
                        <i className="ri-play-fill text-2xl"></i>
                    )}
                </button>

                {/* 下一曲目 */}
                <button
                    onClick={onNext}
                    disabled={playlistCount === 0}
                    className="p-2 border border-theme-highlight hover:border-theme-primary text-theme-dim hover:text-theme-primary transition-colors rounded-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('NEXT_TRACK')}
                >
                    <i className="ri-skip-forward-line text-xl"></i>
                </button>

                {/* 音量条 */}
                <div className="flex-1 h-9 flex items-center gap-2 px-2 border border-theme-highlight/30 rounded-sm bg-black/10">
                    <i
                        className={`${displayVolume === 0 ? 'ri-volume-mute-line' : 'ri-volume-up-line'} text-theme-dim hover:text-theme-primary text-base shrink-0 cursor-pointer transition-colors`}
                        onClick={() => {
                            if (displayVolume === 0) {
                                onVolumeChange(previousVolumeRef.current || 0.5);
                            } else {
                                previousVolumeRef.current = displayVolume;
                                onVolumeChange(0);
                            }
                        }}
                    ></i>
                    <div className="w-full h-4 flex items-center relative group">
                        <div
                            ref={volumeBarRef}
                            className="w-full h-1 bg-theme-highlight/30 relative rounded-full"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
                                onVolumeChange(newVolume);
                            }}
                        >
                            <div
                                className="h-full bg-theme-dim group-hover:bg-theme-primary transition-colors relative"
                                style={{ width: `${displayVolume * 100}%` }}
                            ></div>
                        </div>
                        {/* 可拖拽的圆球滑块 */}
                        <div
                            className="absolute w-3 h-3 bg-theme-primary rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-125"
                            style={{
                                left: `${displayVolume * 100}%`,
                                transform: 'translateX(-50%)'
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                isVolumeDraggingRef.current = true;
                                const rect = volumeBarRef.current!.getBoundingClientRect();
                                const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
                                setDragVolume(newVolume);
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerInterface;