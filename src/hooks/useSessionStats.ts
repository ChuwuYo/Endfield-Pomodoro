import { useEffect, useState } from "react";
import {
    SECONDS_PER_HOUR,
    SECONDS_PER_MINUTE,
    STORAGE_KEYS,
} from "../constants";
import { TimerMode } from "../types";

type UseSessionStatsResult = {
    sessionCount: number;
    hours: number;
    minutes: number;
    seconds: number;
    isTimerRunning: boolean;
    remainingSeconds: number | null;
    remainingMode: TimerMode | null;
    onSessionsUpdate: (newCount: number) => void;
    onTick: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
};

// 会话数与专注时长存 sessionStorage，仅在当前标签页有效
export const useSessionStats = (
    workDuration: number,
): UseSessionStatsResult => {
    const [sessionCount, setSessionCount] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEYS.SESSIONS);
            return saved ? Math.floor(Number(saved)) || 0 : 0;
        } catch {
            return 0;
        }
    });

    const [accumulatedSeconds, setAccumulatedSeconds] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEYS.TOTAL_SECONDS);
            return saved ? Math.floor(Number(saved)) || 0 : 0;
        } catch {
            return 0;
        }
    });

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
        null,
    );
    const [remainingMode, setRemainingMode] = useState<TimerMode | null>(null);

    useEffect(() => {
        try {
            sessionStorage.setItem(
                STORAGE_KEYS.SESSIONS,
                sessionCount.toString(),
            );
        } catch (e) {
            console.error("Failed to persist session count", e);
        }
    }, [sessionCount]);

    useEffect(() => {
        try {
            sessionStorage.setItem(
                STORAGE_KEYS.TOTAL_SECONDS,
                accumulatedSeconds.toString(),
            );
        } catch (e) {
            console.error("Failed to persist total seconds", e);
        }
    }, [accumulatedSeconds]);

    const onSessionsUpdate = (newCount: number) => {
        if (newCount === 0) {
            setSessionCount(0);
            setAccumulatedSeconds(0);
            setElapsedSeconds(0);
            return;
        }

        setSessionCount(newCount);
        if (elapsedSeconds > 0) {
            setAccumulatedSeconds((prev) => prev + elapsedSeconds);
        }
        setElapsedSeconds(0);
    };

    const onTick = (timeLeft: number, mode: TimerMode, isActive: boolean) => {
        queueMicrotask(() => {
            const running = Boolean(isActive && timeLeft > 0);
            setIsTimerRunning(running);
            setRemainingSeconds(timeLeft);
            setRemainingMode(mode);

            if (mode === TimerMode.WORK) {
                const totalWorkSeconds = workDuration * SECONDS_PER_MINUTE;
                const newElapsed = totalWorkSeconds - timeLeft;
                setElapsedSeconds(newElapsed);
            } else {
                setElapsedSeconds(0);
            }
        });
    };

    const totalSeconds = accumulatedSeconds + elapsedSeconds;
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor(
        (totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
    );
    const seconds = totalSeconds % SECONDS_PER_MINUTE;

    return {
        sessionCount,
        hours,
        minutes,
        seconds,
        isTimerRunning,
        remainingSeconds,
        remainingMode,
        onSessionsUpdate,
        onTick,
    };
};
