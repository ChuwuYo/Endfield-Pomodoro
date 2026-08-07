import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayMode } from "../types";
import { useShuffle } from "./useShuffle";

/** Flush queueMicrotask used by useShuffle's init effect */
const flushMicrotasks = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe("useShuffle", () => {
    beforeEach(() => {
        // random ≈ 1 → Fisher-Yates 不做交换，洗牌结果保持 [0,1,2,...]
        vi.spyOn(Math, "random").mockReturnValue(0.999);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("yields each index exactly once before reshuffling", async () => {
        const { result, rerender } = renderHook(
            ({ currentIndex }) => useShuffle(5, PlayMode.RANDOM, currentIndex),
            { initialProps: { currentIndex: 0 } },
        );

        await flushMicrotasks();

        const seen = new Set<number>([0]);
        let current = 0;
        for (let i = 0; i < 4; i++) {
            let next = -1;
            act(() => {
                next = result.current.getNextRandomIndex();
            });
            expect(next).toBe(current + 1);
            expect(seen.has(next)).toBe(false);
            seen.add(next);
            current = next;
            rerender({ currentIndex: current });
        }

        expect(seen.size).toBe(5);
        expect([...seen].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    });

    it("peekNextRandomIndex matches the next getNextRandomIndex value", async () => {
        const { result, rerender } = renderHook(
            ({ currentIndex }) => useShuffle(4, PlayMode.RANDOM, currentIndex),
            { initialProps: { currentIndex: 0 } },
        );

        await flushMicrotasks();

        expect(result.current.peekNextRandomIndex()).toBe(1);

        let next = -1;
        act(() => {
            next = result.current.getNextRandomIndex();
        });
        expect(next).toBe(1);

        rerender({ currentIndex: next });
        expect(result.current.peekNextRandomIndex()).toBe(2);
    });

    it("avoids repeating the last track immediately when reshuffling", async () => {
        const { result, rerender } = renderHook(
            ({ currentIndex }) => useShuffle(3, PlayMode.RANDOM, currentIndex),
            { initialProps: { currentIndex: 0 } },
        );

        await flushMicrotasks();

        // Advance to the last index in the identity order [0,1,2]
        let current = 0;
        for (let i = 0; i < 2; i++) {
            let next = -1;
            act(() => {
                next = result.current.getNextRandomIndex();
            });
            current = next;
            rerender({ currentIndex: current });
        }
        expect(current).toBe(2);

        // Next call reshuffles; head-tail guard must not start with 2
        let reshuffledFirst = -1;
        act(() => {
            reshuffledFirst = result.current.getNextRandomIndex();
        });

        expect(reshuffledFirst).not.toBe(2);
        expect(reshuffledFirst).toBeGreaterThanOrEqual(0);
        expect(reshuffledFirst).toBeLessThan(3);
    });
});
