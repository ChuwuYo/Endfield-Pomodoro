import { afterEach, describe, expect, it, vi } from "vitest";
import { subscribePointerFrame } from "./pointerFrame";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("subscribePointerFrame", () => {
    it("coalesces moves into one callback per frame with the latest position", () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
            frames.push(cb);
            return frames.length;
        });
        vi.stubGlobal("cancelAnimationFrame", vi.fn());

        const onFrame = vi.fn();
        const unsubscribe = subscribePointerFrame(onFrame);

        window.dispatchEvent(
            new MouseEvent("mousemove", { clientX: 1, clientY: 2 }),
        );
        window.dispatchEvent(
            new MouseEvent("mousemove", { clientX: 30, clientY: 40 }),
        );
        expect(frames).toHaveLength(1);
        expect(onFrame).not.toHaveBeenCalled();

        frames[0](0);
        expect(onFrame).toHaveBeenCalledTimes(1);
        expect(onFrame).toHaveBeenCalledWith(30, 40);

        unsubscribe();
        window.dispatchEvent(
            new MouseEvent("mousemove", { clientX: 5, clientY: 6 }),
        );
        expect(frames).toHaveLength(1);
    });

    it("cancels a pending frame on unsubscribe", () => {
        vi.stubGlobal("requestAnimationFrame", () => 7);
        const cancel = vi.fn();
        vi.stubGlobal("cancelAnimationFrame", cancel);

        const unsubscribe = subscribePointerFrame(vi.fn());
        window.dispatchEvent(new MouseEvent("mousemove"));
        unsubscribe();
        expect(cancel).toHaveBeenCalledWith(7);
    });
});
