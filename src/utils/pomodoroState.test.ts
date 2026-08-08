import { describe, expect, it } from "vitest";
import { TimerMode } from "../types";
import { advancePomodoroState, parseStoredTimerPayload } from "./pomodoroState";

describe("advancePomodoroState", () => {
    it("moves work completion to short break and increments session", () => {
        expect(advancePomodoroState(TimerMode.WORK, 0)).toEqual({
            nextMode: TimerMode.SHORT_BREAK,
            nextSessionCount: 1,
        });
        expect(advancePomodoroState(TimerMode.WORK, 2)).toEqual({
            nextMode: TimerMode.SHORT_BREAK,
            nextSessionCount: 3,
        });
    });

    it("enters long break every 4th completed work session", () => {
        expect(advancePomodoroState(TimerMode.WORK, 3)).toEqual({
            nextMode: TimerMode.LONG_BREAK,
            nextSessionCount: 4,
        });
        expect(advancePomodoroState(TimerMode.WORK, 7)).toEqual({
            nextMode: TimerMode.LONG_BREAK,
            nextSessionCount: 8,
        });
    });

    it("returns to work after short or long break without changing session", () => {
        expect(advancePomodoroState(TimerMode.SHORT_BREAK, 2)).toEqual({
            nextMode: TimerMode.WORK,
            nextSessionCount: 2,
        });
        expect(advancePomodoroState(TimerMode.LONG_BREAK, 4)).toEqual({
            nextMode: TimerMode.WORK,
            nextSessionCount: 4,
        });
    });
});

describe("parseStoredTimerPayload", () => {
    it("rejects unknown mode so callers fall back to WORK/default duration", () => {
        expect(
            parseStoredTimerPayload({
                mode: "FOCUS",
                timeLeft: 120,
                isActive: true,
                startTs: 1,
            }),
        ).toBeNull();
    });

    it("accepts valid modes and subtracts elapsed while active", () => {
        const now = 10_000;
        expect(
            parseStoredTimerPayload(
                {
                    mode: TimerMode.SHORT_BREAK,
                    timeLeft: 90,
                    isActive: true,
                    startTs: now - 5_500,
                },
                now,
            ),
        ).toEqual({
            mode: TimerMode.SHORT_BREAK,
            timeLeft: 85,
            isActive: true,
        });
    });
});
