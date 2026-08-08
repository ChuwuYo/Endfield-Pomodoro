import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout, TimeoutError } from "./fetchWithTimeout";

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("fetchWithTimeout", () => {
    it("returns the fetch response on success", async () => {
        const response = new Response("ok", { status: 200 });
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => response),
        );

        await expect(
            fetchWithTimeout("https://example.test", {}, { timeoutMs: 1000 }),
        ).resolves.toBe(response);
    });

    it("rejects with TimeoutError when the request exceeds timeoutMs", async () => {
        vi.useFakeTimers();
        vi.stubGlobal(
            "fetch",
            vi.fn(
                (_url: string, init?: RequestInit) =>
                    new Promise<Response>((_resolve, reject) => {
                        init?.signal?.addEventListener("abort", () => {
                            reject(
                                new DOMException(
                                    "The operation was aborted.",
                                    "AbortError",
                                ),
                            );
                        });
                    }),
            ),
        );

        const pending = fetchWithTimeout(
            "https://example.test",
            {},
            { timeoutMs: 50 },
        );
        const expectation =
            expect(pending).rejects.toBeInstanceOf(TimeoutError);
        await vi.advanceTimersByTimeAsync(50);
        await expectation;
    });

    it("aborts when externalSignal is already aborted", async () => {
        const fetchMock = vi.fn(
            (_url: string, init?: RequestInit) =>
                new Promise<Response>((_resolve, reject) => {
                    if (init?.signal?.aborted) {
                        reject(
                            new DOMException(
                                "The operation was aborted.",
                                "AbortError",
                            ),
                        );
                        return;
                    }
                    init?.signal?.addEventListener("abort", () => {
                        reject(
                            new DOMException(
                                "The operation was aborted.",
                                "AbortError",
                            ),
                        );
                    });
                }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const external = new AbortController();
        external.abort();

        await expect(
            fetchWithTimeout(
                "https://example.test",
                {},
                { timeoutMs: 1000, externalSignal: external.signal },
            ),
        ).rejects.toMatchObject({ name: "AbortError" });
    });

    it("aborts in-flight fetch when externalSignal aborts later", async () => {
        const fetchMock = vi.fn(
            (_url: string, init?: RequestInit) =>
                new Promise<Response>((_resolve, reject) => {
                    if (init?.signal?.aborted) {
                        reject(
                            new DOMException(
                                "The operation was aborted.",
                                "AbortError",
                            ),
                        );
                        return;
                    }
                    init?.signal?.addEventListener("abort", () => {
                        reject(
                            new DOMException(
                                "The operation was aborted.",
                                "AbortError",
                            ),
                        );
                    });
                }),
        );
        vi.stubGlobal("fetch", fetchMock);

        const external = new AbortController();
        const pending = fetchWithTimeout(
            "https://example.test",
            {},
            { timeoutMs: 5000, externalSignal: external.signal },
        );

        expect(fetchMock).toHaveBeenCalled();
        external.abort();

        await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    });
});
