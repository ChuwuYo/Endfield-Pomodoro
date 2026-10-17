import { LONG_BREAK_INTERVAL, MS_PER_SECOND } from "../constants";
import { TimerMode } from "../types";

export type PomodoroAdvanceResult = {
    nextMode: TimerMode;
    nextSessionCount: number;
};

export type RestoredTimer = {
    mode?: TimerMode;
    timeLeft: number | null;
    isActive: boolean;
};

const TIMER_MODE_VALUES = new Set<string>(Object.values(TimerMode));

export const advancePomodoroState = (
    mode: TimerMode,
    sessionCount: number,
    longBreakInterval: number = LONG_BREAK_INTERVAL,
): PomodoroAdvanceResult => {
    if (mode === TimerMode.WORK) {
        const nextSessionCount = sessionCount + 1;
        const nextMode =
            nextSessionCount % longBreakInterval === 0
                ? TimerMode.LONG_BREAK
                : TimerMode.SHORT_BREAK;
        return { nextMode, nextSessionCount };
    }

    return { nextMode: TimerMode.WORK, nextSessionCount: sessionCount };
};

// startTs 是剩余 timeLeft 的采样时刻
export const parseStoredTimerPayload = (
    parsed: unknown,
    now: number = Date.now(),
): RestoredTimer | null => {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
    }

    const raw = parsed as Record<string, unknown>;

    if ("mode" in raw && raw.mode != null) {
        if (typeof raw.mode !== "string" || !TIMER_MODE_VALUES.has(raw.mode)) {
            return null;
        }
    }

    const candidateMode =
        typeof raw.mode === "string" && TIMER_MODE_VALUES.has(raw.mode)
            ? (raw.mode as TimerMode)
            : undefined;
    const candidateTime =
        typeof raw.timeLeft === "number" && Number.isFinite(raw.timeLeft)
            ? raw.timeLeft
            : null;
    const candidateActive = Boolean(raw.isActive);
    const candidateStart =
        typeof raw.startTs === "number" && Number.isFinite(raw.startTs)
            ? raw.startTs
            : null;

    let restoredTime: number | null = null;
    let restoredActive = false;

    if (candidateTime != null) {
        let restored = candidateTime;
        if (candidateActive && candidateStart != null) {
            const elapsed = Math.floor((now - candidateStart) / MS_PER_SECOND);
            restored = Math.max(0, candidateTime - elapsed);
        }
        restoredTime = restored;
        restoredActive = Boolean(candidateActive && restored > 0);
    }

    if (candidateMode === undefined && restoredTime === null) return null;

    return {
        mode: candidateMode,
        timeLeft: restoredTime,
        isActive: restoredActive,
    };
};

/**
 * 计时结束时刻：沿用的锚点与当前剩余秒数相符时保留，否则按 now 重新锚定。
 * 容忍 tick 提交跨过秒边界（最多 1s），每秒的 effect 重建不累积调度延迟。
 */
export const resolveTimerEndAt = (
    anchor: number | null,
    now: number,
    timeLeft: number,
): number => {
    if (anchor !== null) {
        const remainingMs = anchor - now;
        if (
            remainingMs <= timeLeft * MS_PER_SECOND &&
            remainingMs > (timeLeft - 2) * MS_PER_SECOND
        ) {
            return anchor;
        }
    }
    return now + timeLeft * MS_PER_SECOND;
};
