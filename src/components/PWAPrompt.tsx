import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
import {
    setPwaRegistration,
    updatePwaQuietly,
    warmOnDemandFontCacheOnFirstControl,
} from "../utils/pwaRegistration";
import { decidePwaUpdateAction, reloadPage } from "../utils/pwaUpdate";
import { useSnackbar } from "./snackbar";

const PWA_UPDATED_SNACKBAR_ID = "pwa-updated";

/**
 * 不用 workbox-window 默认的激活即 reload：前台先提示，切到后台再刷新，避免打断番茄钟或音乐。
 * @see https://vite-pwa-org.netlify.app/guide/auto-update.html
 */
export function PWAPrompt() {
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastVisibilityCheckRef = useRef<number>(0);
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
                warmOnDemandFontCacheOnFirstControl();
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

        const handlePreloadError = () => {
            if (pendingReloadRef.current) return;
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
