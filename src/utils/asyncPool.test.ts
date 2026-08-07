import { describe, expect, it } from "vitest";
import { asyncPool } from "./asyncPool";

describe("asyncPool", () => {
    it("respects concurrency limit", async () => {
        let running = 0;
        let maxRunning = 0;

        await asyncPool(2, [1, 2, 3, 4, 5], async () => {
            running += 1;
            maxRunning = Math.max(maxRunning, running);
            await new Promise((r) => setTimeout(r, 20));
            running -= 1;
            return true;
        });

        expect(maxRunning).toBeLessThanOrEqual(2);
    });

    it("preserves result order matching input order", async () => {
        const results = await asyncPool(2, [1, 2, 3], async (n) => {
            await new Promise((r) => setTimeout(r, (4 - n) * 10));
            return n * 10;
        });
        expect(results).toEqual([10, 20, 30]);
    });

    it("propagates task errors", async () => {
        await expect(
            asyncPool(2, [1, 2, 3], async (n) => {
                if (n === 2) throw new Error("boom");
                return n;
            }),
        ).rejects.toThrow("boom");
    });

    it("runs all in parallel when limit <= 0", async () => {
        let running = 0;
        let maxRunning = 0;

        await asyncPool(0, [1, 2, 3], async () => {
            running += 1;
            maxRunning = Math.max(maxRunning, running);
            await new Promise((r) => setTimeout(r, 15));
            running -= 1;
        });

        expect(maxRunning).toBe(3);
    });
});
