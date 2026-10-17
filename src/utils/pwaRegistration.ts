import { MANUAL_UPDATE_CHECK_TIMEOUT_MS } from "../constants";

/** 手动检查更新的结果 */
export type ManualUpdateCheckResult = "latest" | "found" | "offline" | "error";

type Listener = () => void;

let currentRegistration: ServiceWorkerRegistration | null = null;
const listeners = new Set<Listener>();

/** 记录当前 SW 注册对象，并通知订阅方 */
export const setPwaRegistration = (
    registration: ServiceWorkerRegistration | null,
): void => {
    if (currentRegistration === registration) return;
    currentRegistration = registration;
    for (const listener of listeners) listener();
};

/** 读取当前 SW 注册对象；未注册（开发模式 / 不支持 SW）时为 null */
export const getPwaRegistration = (): ServiceWorkerRegistration | null =>
    currentRegistration;

/** 订阅注册对象变化，供 useSyncExternalStore 使用 */
export const subscribePwaRegistration = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const isOffline = (): boolean =>
    typeof navigator !== "undefined" && navigator.onLine === false;

/**
 * 手动触发一次 SW 更新检查。
 * 调用 registration.update()，期间监听 updatefound，结束后检查 installing / waiting：
 * 出现新 worker 即为 found，之后的安装与生效交给 autoUpdate 流程。
 *
 * @see https://vite-pwa-org.netlify.app/guide/periodic-sw-updates.html
 * @see https://web.dev/articles/service-worker-lifecycle#manual_updates
 */
export const checkForPwaUpdate = async (
    registration: ServiceWorkerRegistration,
    timeoutMs: number = MANUAL_UPDATE_CHECK_TIMEOUT_MS,
): Promise<ManualUpdateCheckResult> => {
    if (isOffline()) return "offline";
    if (registration.installing || registration.waiting) return "found";

    let updateFound = false;
    const handleUpdateFound = () => {
        updateFound = true;
    };
    registration.addEventListener("updatefound", handleUpdateFound);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        await Promise.race([
            registration.update(),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error("update check timed out")),
                    timeoutMs,
                );
            }),
        ]);
    } catch (error) {
        console.warn("[PWA] Manual update check failed:", error);
        return isOffline() ? "offline" : "error";
    } finally {
        clearTimeout(timeoutId);
        registration.removeEventListener("updatefound", handleUpdateFound);
    }

    return updateFound || registration.installing || registration.waiting
        ? "found"
        : "latest";
};
