import { LONG_BREAK_INTERVAL } from "../constants";
import { TimerMode } from "../types";

export type PomodoroAdvanceResult = {
    nextMode: TimerMode;
    nextSessionCount: number;
};

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
