import React, { useEffect, useId, useRef, useState } from "react";
import {
    LONG_BREAK_INTERVAL,
    MS_PER_SECOND,
    SECONDS_PER_MINUTE,
    STORAGE_KEYS,
    TIMER_CHECK_INTERVAL_MS,
} from "../constants";
import type { Settings } from "../types";
import { TimerMode } from "../types";
import { useTranslation } from "../utils/i18n";
import {
    advancePomodoroState,
    parseStoredTimerPayload,
    type RestoredTimer,
} from "../utils/pomodoroState";
import { useSound } from "./SoundManager";
import { Button, Panel } from "./ui";

interface PomodoroProps {
    settings: Settings;
    sessionCount: number;
    onSessionsUpdate: (count: number) => void;
    // 将 isActive 明确传递给父组件，方便父组件区分「有剩余但已暂停」与「正在运行」
    onTick?: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
}

type TimerPayload = {
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    startTs?: number;
};

const durationSecondsForMode = (
    mode: TimerMode,
    settings: Settings,
): number => {
    switch (mode) {
        case TimerMode.WORK:
            return settings.workDuration * SECONDS_PER_MINUTE;
        case TimerMode.SHORT_BREAK:
            return settings.shortBreakDuration * SECONDS_PER_MINUTE;
        case TimerMode.LONG_BREAK:
            return settings.longBreakDuration * SECONDS_PER_MINUTE;
        default: {
            const _exhaustive: never = mode;
            return _exhaustive;
        }
    }
};

// 读取持久化的计时器状态；仅在组件首次渲染的 state 惰性初始化中调用一次
const readRestoredTimer = (): RestoredTimer | null => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEYS.TIMER);
        if (!raw) return null;
        return parseStoredTimerPayload(JSON.parse(raw));
    } catch (err) {
        console.error("Failed to parse timer payload from sessionStorage", err);
        return null;
    }
};

const Pomodoro: React.FC<PomodoroProps> = ({
    settings,
    sessionCount,
    onSessionsUpdate,
    onTick,
}) => {
    const t = useTranslation(settings.language);
    const playSound = useSound(settings.soundEnabled, settings.soundVolume);
    const reactId = useId();
    const gradientId = `progress-gradient-${reactId}`;

    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    const onTickRef = useRef(onTick);
    useEffect(() => {
        onTickRef.current = onTick;
    }, [onTick]);

    // 惰性读取一次持久化状态（替代挂载 effect 中的同步 setState）
    const [restored] = useState(readRestoredTimer);

    // 本地状态：模式、剩余时间、是否激活（优先采用恢复值）
    const [mode, setMode] = useState<TimerMode>(
        restored?.mode ?? TimerMode.WORK,
    );
    const [timeLeft, setTimeLeft] = useState<number>(
        () => restored?.timeLeft ?? settings.workDuration * SECONDS_PER_MINUTE,
    );
    const [isActive, setIsActive] = useState<boolean>(
        restored?.isActive ?? false,
    );

    const modeRef = useRef(mode);
    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    const getTotalTime = () => durationSecondsForMode(mode, settings);

    /** 显式应用某模式的时长（完成流转 / 手动重置） */
    const applyTimerForMode = (nextMode: TimerMode, autoStart: boolean) => {
        const newTime = durationSecondsForMode(nextMode, settingsRef.current);
        setTimeLeft(newTime);
        setIsActive(autoStart);
        if (autoStart) playSound("start");
        onTickRef.current?.(newTime, nextMode, autoStart);
    };

    // 挂载时将初始状态同步给父组件（仅一次；故意不含 deps）
    useEffect(() => {
        onTickRef.current?.(timeLeft, mode, isActive);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only parent sync
    }, []);

    const sendNotification = (title: string, body: string) => {
        if (!settingsRef.current.notificationsEnabled) return;

        if ("Notification" in window && Notification.permission === "granted") {
            try {
                const n = new Notification(title, {
                    body,
                    icon: "/pwa-192x192.png",
                    requireInteraction: true,
                    silent: false,
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                };
            } catch (e) {
                console.error("Notification error:", e);
            }
        }
    };

    const handleComplete = () => {
        playSound("end");

        const currentMode = modeRef.current;
        const { nextMode, nextSessionCount } = advancePomodoroState(
            currentMode,
            sessionCount,
            LONG_BREAK_INTERVAL,
        );

        const autoStart =
            currentMode === TimerMode.WORK
                ? settingsRef.current.autoStartBreaks
                : settingsRef.current.autoStartWork;

        if (currentMode === TimerMode.WORK) {
            sendNotification(
                t("NOTIFICATION_WORK_COMPLETE_TITLE"),
                t("NOTIFICATION_WORK_COMPLETE_BODY"),
            );
            onSessionsUpdate(nextSessionCount);
        } else {
            sendNotification(
                t("NOTIFICATION_BREAK_COMPLETE_TITLE"),
                t("NOTIFICATION_BREAK_COMPLETE_BODY"),
            );
        }

        setMode(nextMode);
        applyTimerForMode(nextMode, autoStart);
    };

    const handleCompleteRef = useRef(handleComplete);
    useEffect(() => {
        handleCompleteRef.current = handleComplete;
    });

    const resetTimer = () => {
        applyTimerForMode(mode, false);
    };

    // 将计时器状态持久化到 sessionStorage（仅跟计时状态走，避免无关 settings 改写 startTs）
    useEffect(() => {
        try {
            const payload: TimerPayload = { mode, timeLeft, isActive };
            if (isActive) {
                // 快照语义：当前剩余 timeLeft，采样时刻为 now（恢复时再扣经过秒数）
                payload.startTs = Date.now();
            }
            sessionStorage.setItem(STORAGE_KEYS.TIMER, JSON.stringify(payload));
        } catch (err) {
            if (err instanceof Error && err.name === "QuotaExceededError") {
                console.warn(
                    "sessionStorage quota exceeded, timer state will not persist",
                );
            } else {
                console.error(
                    "Failed to persist timer payload to sessionStorage",
                    err,
                );
            }
        }
    }, [mode, timeLeft, isActive]);

    // 设置页改了时长：按当前模式重算剩余时间（签名未变则跳过，兼容 StrictMode 二次 effect）
    const lastDurationKeyRef = useRef(
        `${settings.workDuration}|${settings.shortBreakDuration}|${settings.longBreakDuration}`,
    );
    useEffect(() => {
        const durationKey = `${settings.workDuration}|${settings.shortBreakDuration}|${settings.longBreakDuration}`;
        if (lastDurationKeyRef.current === durationKey) return;
        lastDurationKeyRef.current = durationKey;

        const currentMode = modeRef.current;
        const newTime = durationSecondsForMode(
            currentMode,
            settingsRef.current,
        );
        setTimeLeft(newTime);
        setIsActive(false);
        onTickRef.current?.(newTime, currentMode, false);
    }, [
        settings.workDuration,
        settings.shortBreakDuration,
        settings.longBreakDuration,
    ]);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            return;
        }

        const startTime = Date.now();
        const expectedEndTime = startTime + timeLeft * MS_PER_SECOND;

        const interval = window.setInterval(() => {
            const now = Date.now();
            const remaining = Math.ceil(
                (expectedEndTime - now) / MS_PER_SECOND,
            );
            const currentMode = modeRef.current;

            if (remaining <= 0) {
                setTimeLeft(0);
                onTickRef.current?.(0, currentMode, true);
                clearInterval(interval);
                handleCompleteRef.current();
            } else if (remaining !== timeLeft) {
                setTimeLeft(remaining);
                onTickRef.current?.(remaining, currentMode, true);
            }
        }, TIMER_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        if (!isActive) playSound("start");
        const next = !isActive;
        setIsActive(next);
        // 主动通知父组件当前剩余时间、模式与运行状态，确保在暂停/恢复时父组件（footer/title）立即同步状态
        onTickRef.current?.(timeLeft, mode, next);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / SECONDS_PER_MINUTE);
        const s = seconds % SECONDS_PER_MINUTE;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const progress = (() => {
        const total = getTotalTime();
        return total > 0 ? ((total - timeLeft) / total) * 100 : 0;
    })();

    const getStatusText = () => {
        if (!isActive) {
            if (timeLeft === getTotalTime()) {
                return t("STANDBY");
            }
            return t("PAUSED_STATUS");
        }
        switch (mode) {
            case TimerMode.WORK:
                return t("MODE_WORK");
            case TimerMode.SHORT_BREAK:
                return t("MODE_SHORT");
            case TimerMode.LONG_BREAK:
                return t("MODE_LONG");
            default:
                return t("MODE_WORK");
        }
    };

    return (
        <Panel
            className="w-full h-full min-h-full p-6 md:p-8"
            title={t("CHRONO_MODULE")}
        >
            <div className="flex flex-col h-full w-full items-center gap-6 relative">
                {/* 顶部信息 */}
                <div className="w-full flex justify-between items-start border-b border-theme-highlight/30 pb-4 shrink-0">
                    <div className="flex flex-col">
                        <span className="text-ui-micro text-theme-dim tracking-ui-widest uppercase mb-1">
                            {t("STATUS")}
                        </span>
                        <div
                            className={`text-ui-xl font-ui-mono font-bold tracking-ui-widest ${isActive ? (mode === TimerMode.WORK ? "text-theme-primary" : "text-theme-secondary") : "text-theme-dim"}`}
                        >
                            {getStatusText()}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            className="w-8 h-8 p-0 text-theme-dim hover:text-theme-primary border-theme-dim/20 hover:border-theme-primary/50"
                            onClick={() => onSessionsUpdate(0)}
                            title={t("RESET_SESSIONS")}
                        >
                            <i className="ri-refresh-line icon-ui-lg"></i>
                        </Button>
                        <div className="text-right">
                            <span className="text-ui-micro text-theme-dim tracking-ui-widest uppercase mb-1 block">
                                {t("SESSIONS_COMPLETED")}
                            </span>
                            <div className="text-ui-2xl font-ui-mono text-theme-text">
                                {sessionCount.toString().padStart(2, "0")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 计时器显示 */}
                <div className="flex-1 w-full flex items-center justify-center relative py-8 md:py-10 min-h-[22rem] md:min-h-[27rem]">
                    <div className="relative w-[var(--size-timer-ring)] h-[var(--size-timer-ring)] md:w-[var(--size-timer-ring-md)] md:h-[var(--size-timer-ring-md)] flex items-center justify-center shrink-0 group max-w-full max-h-full">
                        {/* 脉冲背景环（呼吸效果） */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-full border-2 border-theme-primary/30 animate-ping-slow"></div>
                        )}

                        <svg
                            className="absolute w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(var(--color-primary),0.2)]"
                            viewBox="0 0 256 256"
                        >
                            <defs>
                                <linearGradient
                                    id={gradientId}
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="0%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--color-primary)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--color-secondary)"
                                    />
                                </linearGradient>
                            </defs>
                            {/* 轨道 */}
                            <circle
                                className="text-theme-highlight/20"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="transparent"
                                r="120"
                                cx="128"
                                cy="128"
                            />
                            {/* 进度 */}
                            <circle
                                className={`${mode === TimerMode.WORK ? "text-theme-primary" : "text-theme-accent"} transition-all duration-1000 ease-linear`}
                                strokeWidth="4"
                                strokeDasharray={2 * Math.PI * 120}
                                strokeDashoffset={
                                    2 * Math.PI * 120 * (1 - progress / 100)
                                }
                                strokeLinecap="round"
                                stroke="currentColor" // Uses text color which we override via class if needed, or stick to solid
                                fill="transparent"
                                r="120"
                                cx="128"
                                cy="128"
                                style={{
                                    filter: "drop-shadow(0 0 4px var(--color-primary))",
                                }}
                            />
                            {/* 发光尖端 */}
                            <circle
                                fill="var(--color-text)"
                                r="4"
                                cx="248"
                                cy="128"
                                className="transition-all duration-1000 ease-linear"
                                style={{
                                    transformOrigin: "50% 50%",
                                    transform: `rotate(${progress * 3.6}deg)`,
                                }}
                            />
                        </svg>

                        {/* 内部装饰元素 */}
                        <div
                            className={`absolute inset-8 border border-theme-highlight/20 rounded-full opacity-50 border-dashed ${isActive ? "animate-spin-slow" : ""}`}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[90%] h-[1px] bg-theme-highlight/10 absolute rotate-45"></div>
                            <div className="w-[90%] h-[1px] bg-theme-highlight/10 absolute -rotate-45"></div>
                        </div>

                        {/* 时间文本：倒计时可查询，但不挂 aria-live，避免每秒打断读屏 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 select-none">
                            <span
                                className={`text-ui-display md:text-ui-display-xl font-ui-mono font-bold text-theme-text drop-shadow-2xl tabular-nums transition-transform will-change-transform`}
                                style={{
                                    transform: isActive
                                        ? "scale(1.05)"
                                        : "scale(1)",
                                    transformOrigin: "center",
                                }}
                                role="timer"
                                aria-label={`${t("TIME_REMAINING")} ${formatTime(timeLeft)}`}
                            >
                                {formatTime(timeLeft)}
                            </span>
                            <span
                                className="text-ui-xs text-theme-dim font-ui-mono mt-2 tracking-ui-signal uppercase animate-pulse"
                                aria-hidden="true"
                            >
                                {t("TIME_REMAINING")}
                            </span>
                            {/* 仅播报状态/模式变化，不含每秒跳动的倒计时 */}
                            <span
                                className="sr-only"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                {getStatusText()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 控制 */}
                <div className="w-full grid grid-cols-4 gap-4 shrink-0">
                    <div
                        className={`col-span-2 h-[var(--size-control-lg)] relative ${!isActive ? "group" : ""}`}
                    >
                        {!isActive && (
                            <div className="absolute -inset-[3px] overflow-hidden clip-path-slant z-0 bg-theme-dim/10">
                                <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] glow-conic-secondary animate-spin-slow-linear-4s"></div>
                            </div>
                        )}
                        <Button
                            onClick={toggleTimer}
                            variant={isActive ? "secondary" : "primary"}
                            className="w-full h-full text-ui-lg relative z-10"
                            title={isActive ? t("PAUSE") : t("INITIALIZE")}
                        >
                            {isActive ? t("PAUSE") : t("INITIALIZE")}
                        </Button>
                    </div>
                    <Button
                        onClick={resetTimer}
                        variant="ghost"
                        className="col-span-1 h-[var(--size-control-lg)] border border-theme-highlight/30 hover:border-theme-primary"
                        title={t("RESET_TIMER")}
                        aria-label={t("RESET_TIMER")}
                    >
                        <i className="ri-restart-line icon-ui-2xl"></i>
                    </Button>
                    <Button
                        onClick={handleComplete}
                        variant="ghost"
                        className="col-span-1 h-[var(--size-control-lg)] border border-theme-highlight/30 hover:border-theme-primary"
                        title={t("SKIP_TIMER")}
                        aria-label={t("SKIP_TIMER")}
                    >
                        <i className="ri-skip-forward-line icon-ui-2xl"></i>
                    </Button>
                </div>
            </div>
        </Panel>
    );
};

export default Pomodoro;
