import { useEffect, useRef } from "react";

/** active 期间，网络恢复或页面重新可见时调用 retry */
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
