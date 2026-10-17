import { useEffect, useRef } from "react";

/**
 * 在 active 为 true 期间，网络恢复（online）或页面重新可见时调用 retry。
 *
 * @param active - 是否需要重试（例如当前处于加载失败状态）
 * @param retry - 重试函数，始终调用最新传入的版本
 */
export const useRetryOnReconnect = (
    active: boolean,
    retry: () => void,
): void => {
    const retryRef = useRef(retry);

    useEffect(() => {
        retryRef.current = retry;
    }, [retry]);

    useEffect(() => {
        if (!active || typeof window === "undefined") return;

        const handleOnline = () => retryRef.current();
        const handleVisibility = () => {
            if (document.visibilityState === "visible" && navigator.onLine) {
                retryRef.current();
            }
        };

        window.addEventListener("online", handleOnline);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            window.removeEventListener("online", handleOnline);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [active]);
};
