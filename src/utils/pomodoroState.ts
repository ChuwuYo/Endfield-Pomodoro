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

/**
 * 番茄钟阶段完成时的模式/会话数流转（不含音效、通知、自动开始副作用）。
 * 工作完成：session+1，每 longBreakInterval 次进入长休息，否则短休息。
 * 休息完成：回到工作，会话数不变。
 */
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

/**
 * 解析 sessionStorage 中的计时器快照。
 * mode 必须是三个 TimerMode 之一；非法 mode 整份丢弃（回退 WORK/默认时长）。
 * 运行中快照用 startTs 表示「当时剩余 timeLeft 的采样时刻」。
 */
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
