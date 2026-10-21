import { MANUAL_UPDATE_CHECK_TIMEOUT_MS } from "../constants";

export type ManualUpdateCheckResult = "latest" | "found" | "offline" | "error";

type Listener = () => void;

let currentRegistration: ServiceWorkerRegistration | null = null;
const listeners = new Set<Listener>();

export const setPwaRegistration = (
    registration: ServiceWorkerRegistration | null,
): void => {
    if (currentRegistration === registration) return;
    currentRegistration = registration;
    for (const listener of listeners) listener();
};

export const getPwaRegistration = (): ServiceWorkerRegistration | null =>
    currentRegistration;

export const subscribePwaRegistration = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

const isOffline = (): boolean =>
    typeof navigator !== "undefined" && navigator.onLine === false;

const updatePromptListeners = new Set<() => void>();

/** 已有等待生效的新版时，重新显示更新提示 */
export const requestPwaUpdatePrompt = (): void => {
    for (const listener of updatePromptListeners) listener();
};

export const subscribePwaUpdatePrompt = (
    listener: () => void,
): (() => void) => {
    updatePromptListeners.add(listener);
    return () => {
        updatePromptListeners.delete(listener);
    };
};

export const updatePwaQuietly = (
    registration: ServiceWorkerRegistration,
): void => {
    if (registration.installing || isOffline()) return;
    registration.update().catch((error: unknown) => {
        console.warn("[PWA] Background update check failed:", error);
    });
};

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

/** 按需字体资源：CJK 字族 CSS 与 woff2 分片（与 vite.config.ts 中的运行时缓存规则一致） */
export const isOnDemandFontAsset = (url: URL): boolean =>
    url.pathname.startsWith("/assets/") &&
    (/\/(400|700)-[\w-]+\.css$/.test(url.pathname) ||
        /\.woff2$/.test(url.pathname));

/**
 * 首次安装时页面尚未受 SW 控制：SW 接管后重新请求一次已加载的按需字体资源，
 * 使其经过 SW 写入运行时缓存。页面已受控时不做任何事。
 */
export const warmOnDemandFontCacheOnFirstControl = (): void => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
        return;
    const container = navigator.serviceWorker;
    if (container.controller) return;
    const handleControllerChange = () => {
        container.removeEventListener(
            "controllerchange",
            handleControllerChange,
        );
        const urls = performance
            .getEntriesByType("resource")
            .map((entry) => new URL(entry.name, window.location.href))
            .filter(
                (url) =>
                    url.origin === window.location.origin &&
                    isOnDemandFontAsset(url),
            );
        for (const url of urls) {
            fetch(url).catch(() => undefined);
        }
    };
    container.addEventListener("controllerchange", handleControllerChange);
};
