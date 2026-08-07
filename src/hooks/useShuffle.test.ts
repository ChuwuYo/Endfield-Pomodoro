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
        let call = 0;
        vi.spyOn(Math, "random").mockImplementation(() => {
            call += 1;
            // 初始洗牌：保持恒等 [0,1,2]
            // 重洗：使首项等于上一曲末项 2，从而命中首尾相接 swap
            if (call <= 2) return 0.999;
            if (call === 3) return 0; // i=2 → j=0 → [2,1,0]
            return 0.999; // i=1 → j=1 → 保持 [2,1,0]，再被 swap 成 [1,2,0]
        });

        const { result, rerender } = renderHook(
            ({ currentIndex }) => useShuffle(3, PlayMode.RANDOM, currentIndex),
            { initialProps: { currentIndex: 0 } },
        );

        await flushMicrotasks();

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

        let reshuffledFirst = -1;
        act(() => {
            reshuffledFirst = result.current.getNextRandomIndex();
        });

        // 若无 swap，首项会是 2；防护生效后应为 1
        expect(reshuffledFirst).toBe(1);
    });
});
