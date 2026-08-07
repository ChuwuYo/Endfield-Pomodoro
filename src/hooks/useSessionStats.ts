import { useEffect, useState } from "react";
import {
    SECONDS_PER_HOUR,
    SECONDS_PER_MINUTE,
    STORAGE_KEYS,
} from "../constants";
import { TimerMode } from "../types";

/**
 * Hook 返回值类型定义
 */
type UseSessionStatsResult = {
    /** 当前已完成的番茄钟会话数量 */
    sessionCount: number;
    /** 总专注时长（小时部分） */
    hours: number;
    /** 总专注时长（分钟部分） */
    minutes: number;
    /** 总专注时长（秒数部分） */
    seconds: number;
    /** 计时器是否正在运行 */
    isTimerRunning: boolean;
    /** 当前倒计时剩余秒数 */
    remainingSeconds: number | null;
    /** 当前倒计时模式（工作/短休/长休） */
    remainingMode: TimerMode | null;
    /**
     * 更新会话计数的回调函数
     * @param newCount 新的会话数量
     */
    onSessionsUpdate: (newCount: number) => void;
    /**
     * 计时器跳动回调函数，用于同步状态
     * @param timeLeft 剩余时间
     * @param mode 当前模式
     * @param isActive 是否处于激活状态
     */
    onTick: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
};

/**
 * 会话统计 Hook
 *
 * 负责管理和持久化用户的专注数据，包括：
 * 1. 会话数量统计
 * 2. 专注时间累计（实时计算）
 * 3. 数据持久化（sessionStorage）
 * 4. 计时器状态同步
 *
 * @param workDuration 单个工作会话的设定时长（分钟）
 */
export const useSessionStats = (
    workDuration: number,
): UseSessionStatsResult => {
    // 会话数量状态，初始化时尝试从 sessionStorage 读取
    const [sessionCount, setSessionCount] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEYS.SESSIONS);
            return saved ? Math.floor(Number(saved)) || 0 : 0;
        } catch {
            return 0;
        }
    });

    // 累计专注秒数状态，初始化时尝试从 sessionStorage 读取
    const [accumulatedSeconds, setAccumulatedSeconds] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEYS.TOTAL_SECONDS);
            return saved ? Math.floor(Number(saved)) || 0 : 0;
        } catch {
            return 0;
        }
    });

    // 当前会话已过秒数（用于实时更新总时间，而不必等到会话结束）
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // 计时器运行状态
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
        null,
    );
    const [remainingMode, setRemainingMode] = useState<TimerMode | null>(null);

    // 持久化 sessionCount
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

    // 持久化 accumulatedSeconds
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

    /**
     * 处理会话数量更新
     * 当一个番茄钟完成时调用此函数
     */
    const onSessionsUpdate = (newCount: number) => {
        // 如果计数被重置为 0，则清空所有统计数据
        if (newCount === 0) {
            setSessionCount(0);
            setAccumulatedSeconds(0);
            setElapsedSeconds(0);
            return;
        }

        setSessionCount(newCount);
        // 将当前会话的经过时间合并入累计时间
        if (elapsedSeconds > 0) {
            setAccumulatedSeconds((prev) => prev + elapsedSeconds);
        }
        // 重置经过时间，准备开始下一个会话
        setElapsedSeconds(0);
    };

    /**
     * 计时器跳动处理
     * 由计时器组件每秒调用，用于更新实时状态
     */
    const onTick = (timeLeft: number, mode: TimerMode, isActive: boolean) => {
        // 使用微任务避免在渲染周期中同步更新状态导致的警告
        queueMicrotask(() => {
            const running = Boolean(isActive && timeLeft > 0);
            setIsTimerRunning(running);
            setRemainingSeconds(timeLeft);
            setRemainingMode(mode);

            // 仅在工作模式下计算经过时间
            if (mode === TimerMode.WORK) {
                const totalWorkSeconds = workDuration * SECONDS_PER_MINUTE;
                // 计算公式：设定总时长 - 当前剩余时长 = 已经过时长
                const newElapsed = totalWorkSeconds - timeLeft;
                setElapsedSeconds(newElapsed);
            } else {
                // 休息模式下不计入专注时间
                setElapsedSeconds(0);
            }
        });
    };

    // 计算总时间并格式化
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
