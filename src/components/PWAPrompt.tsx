import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
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
        onRegistered(r) {
            if (r) {
                registrationRef.current = r;

                r.update();

                if (intervalRef.current) clearInterval(intervalRef.current);

                intervalRef.current = window.setInterval(() => {
                    r.update();
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
            registration.update();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
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
