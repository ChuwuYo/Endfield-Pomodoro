import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlayMode } from "../types";
import { useShuffle } from "./useShuffle";

describe("useShuffle", () => {
    beforeEach(() => {
        vi.spyOn(Math, "random").mockReturnValue(0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shuffles without duplicates or missing indices", async () => {
        const { result } = renderHook(() => useShuffle(5, PlayMode.RANDOM, 0));

        await waitFor(() => {
            expect(result.current.shuffledIndices).toHaveLength(5);
        });

        const indices = result.current.shuffledIndices;
        expect(new Set(indices).size).toBe(5);
        expect([...indices].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
    });

    it("cycles through all indices before reshuffling", async () => {
        const { result, rerender } = renderHook(
            ({ currentIndex }) => useShuffle(3, PlayMode.RANDOM, currentIndex),
            { initialProps: { currentIndex: 0 } },
        );

        await waitFor(() => {
            expect(result.current.shuffledIndices).toHaveLength(3);
        });

        const order = [...result.current.shuffledIndices];
        rerender({ currentIndex: order[0] });

        const seen: number[] = [];
        for (let i = 0; i < 2; i++) {
            let next = -1;
            act(() => {
                next = result.current.getNextRandomIndex();
            });
            seen.push(next);
            rerender({ currentIndex: next });
        }

        expect(seen).toEqual([order[1], order[2]]);
    });

    it("avoids head-tail collision when reshuffling after full cycle", async () => {
        const { result, rerender } = renderHook(
            ({ currentIndex }) => useShuffle(3, PlayMode.RANDOM, currentIndex),
            { initialProps: { currentIndex: 0 } },
        );

        await waitFor(() => {
            expect(result.current.shuffledIndices).toHaveLength(3);
        });

        const initial = [...result.current.shuffledIndices];
        rerender({ currentIndex: initial[initial.length - 1] });

        let next = -1;
        act(() => {
            next = result.current.getNextRandomIndex();
        });

        expect(next).not.toBe(initial[initial.length - 1]);
        expect(result.current.shuffledIndices[0]).toBe(next);
    });
});
