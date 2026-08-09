import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
import { useSnackbar } from "./snackbar";

const PWA_UPDATED_SNACKBAR_ID = "pwa-updated";

/**
 * SW 注册 / 轮询 / 可见性检查所有权在此。
 *
 * 本项目 `registerType: "autoUpdate"`：vite-plugin-pwa 会 skipWaiting + clientsClaim。
 * 官方客户端在 `activated(isUpdate)` 时默认 `location.reload()`；
 * 传入 `onNeedReload` 可接管该时机，改为应用内 Snackbar，避免与自写
 * `controllerchange` 监听打架，也避免「已自动刷新却还提示手动刷新」的假提示。
 *
 * @see https://vite-pwa-org.netlify.app/guide/auto-update.html
 * @see https://web.dev/articles/service-worker-lifecycle
 */
export function PWAPrompt() {
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastVisibilityCheckRef = useRef<number>(0);
    const [showUpdated, setShowUpdated] = useState(false);
    const snackbar = useSnackbar();

    useRegisterSW({
        onNeedReload() {
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
