import { API_TIMEOUT_MS } from "../constants";

export class TimeoutError extends Error {
    constructor(message = "Timeout") {
        super(message);
        this.name = "TimeoutError";
    }
}

type FetchWithTimeoutOptions = {
    timeoutMs?: number;
    /** 外部取消信号（组件卸载 / 父级 AbortController） */
    externalSignal?: AbortSignal;
};

/**
 * fetch + 超时中止。超时抛 TimeoutError；外部 abort 表现为 AbortError。
 */
export const fetchWithTimeout = async (
    url: string,
    init: RequestInit = {},
    options: FetchWithTimeoutOptions = {},
): Promise<Response> => {
    const timeoutMs = options.timeoutMs ?? API_TIMEOUT_MS;
    const requestController = new AbortController();
    const onAbort = () => requestController.abort();
    const external = options.externalSignal;

    if (external) {
        if (external.aborted) {
            requestController.abort();
        } else {
            external.addEventListener("abort", onAbort);
        }
    }

    let timedOut = false;
    const timeoutId = setTimeout(() => {
        timedOut = true;
        requestController.abort();
    }, timeoutMs);

    try {
        return await fetch(url, {
            ...init,
            signal: requestController.signal,
        });
    } catch (err) {
        if (timedOut) {
            throw new TimeoutError();
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
        external?.removeEventListener("abort", onAbort);
    }
};
