import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
import { setPwaRegistration, updatePwaQuietly } from "../utils/pwaRegistration";
import { decidePwaUpdateAction, reloadPage } from "../utils/pwaUpdate";
import { useSnackbar } from "./snackbar";

const PWA_UPDATED_SNACKBAR_ID = "pwa-updated";

/**
 * SW 注册 / 轮询 / 可见性检查，以及新版本何时生效。
 *
 * 这里接管了 workbox-window 默认的「新 SW 一激活就 reload」：页面可见时先弹 Snackbar，
 * 切到后台再刷新（时机判断见 utils/pwaUpdate.ts），免得打断正在跑的番茄钟或音乐。
 *
 * @see https://vite-pwa-org.netlify.app/guide/auto-update.html
 * @see https://web.dev/articles/service-worker-lifecycle
 */
export function PWAPrompt() {
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastVisibilityCheckRef = useRef<number>(0);
    /** 新版已接管，等页面切到后台再刷新 */
    const pendingReloadRef = useRef(false);
    const [showUpdated, setShowUpdated] = useState(false);
    const snackbar = useSnackbar();

    useRegisterSW({
        onNeedReload() {
            if (
                decidePwaUpdateAction(document.visibilityState) === "reload-now"
            ) {
                reloadPage();
                return;
            }
            pendingReloadRef.current = true;
            setShowUpdated(true);
        },
        onRegisteredSW(_swUrl, r) {
            if (r) {
                registrationRef.current = r;
                setPwaRegistration(r);

                updatePwaQuietly(r);

                if (intervalRef.current) clearInterval(intervalRef.current);

                intervalRef.current = window.setInterval(() => {
                    updatePwaQuietly(r);
                }, HOURLY_CHECK_INTERVAL_MS);
            }
        },
        onRegisterError(error) {
            console.error("[PWA] Registration error:", error);
        },
    });

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") {
                // 切到后台正好刷新，用户看不到跳变
                if (pendingReloadRef.current) {
                    reloadPage();
                }
                return;
            }
            const registration = registrationRef.current;
            if (!registration) {
                return;
            }
            const now = Date.now();
            if (
                now - lastVisibilityCheckRef.current <
                VISIBILITY_CHECK_MIN_INTERVAL_MS
            ) {
                return;
            }
            lastVisibilityCheckRef.current = now;
            updatePwaQuietly(registration);
        };

        // 动态导入失败：新版已接管时旧 chunk 已不在，直接刷新；否则立即检查一次更新
        // @see https://vite.dev/guide/build#load-error-handling
        let reloadingForPreloadError = false;
        const handlePreloadError = (event: VitePreloadErrorEvent) => {
            if (pendingReloadRef.current) {
                // 刷新即恢复，不再抛出原始错误；只刷新一次
                event.preventDefault();
                if (reloadingForPreloadError) return;
                reloadingForPreloadError = true;
                reloadPage();
                return;
            }
            const registration = registrationRef.current;
            if (registration) updatePwaQuietly(registration);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("vite:preloadError", handlePreloadError);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            window.removeEventListener("vite:preloadError", handlePreloadError);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!showUpdated) {
            snackbar.dismiss(PWA_UPDATED_SNACKBAR_ID);
            return;
        }

        snackbar.show({
            id: PWA_UPDATED_SNACKBAR_ID,
            messageKey: "pwa_updated",
            tone: "success",
            durationMs: null,
            action: {
                textKey: "ERROR_BOUNDARY_RELOAD",
                onClick: () => {
                    window.location.reload();
                },
            },
            onDismiss: () => setShowUpdated(false),
        });
    }, [showUpdated, snackbar]);

    return null;
}

export default PWAPrompt;
