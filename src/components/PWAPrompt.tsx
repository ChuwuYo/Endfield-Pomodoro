import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
import { isAppBusy, subscribeAppActivity } from "../utils/appActivity";
import {
    setPwaRegistration,
    subscribePwaUpdatePrompt,
    updatePwaQuietly,
    warmOnDemandFontCacheOnFirstControl,
} from "../utils/pwaRegistration";
import { isPageCurrentFor, reloadPage } from "../utils/pwaUpdate";
import { useSnackbar } from "./snackbar";

const PWA_UPDATED_SNACKBAR_ID = "pwa-updated";

/**
 * prompt 模式：新版 SW 安装后等待，旧版继续服务当前页面。
 * - 页面已是新版（打开时拿到了新 HTML）：直接激活，不刷新
 * - 页面是旧版且应用空闲（无计时、播放、本地歌单），并且页面在后台或用户还没操作过：激活并刷新
 * - 其他情况只提示，由用户点击刷新
 * @see https://vite-pwa-org.netlify.app/guide/prompt-for-update.html
 */
export function PWAPrompt() {
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastVisibilityCheckRef = useRef<number>(0);
    const activationRequestedRef = useRef(false);
    const interactedRef = useRef(false);
    const [updateReady, setUpdateReady] = useState(false);
    const snackbar = useSnackbar();

    const { updateServiceWorker } = useRegisterSW({
        async onNeedRefresh() {
            const waiting = registrationRef.current?.waiting;
            if (waiting && (await isPageCurrentFor(waiting.scriptURL))) {
                activationRequestedRef.current = true;
                void updateServiceWorker(true);
                return;
            }
            setUpdateReady(true);
        },
        // 其他标签页切换到新版时提示；本页发起的激活不在这里刷新
        onNeedReload() {
            if (!activationRequestedRef.current) setUpdateReady(true);
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

    const applyUpdate = useEffectEvent(() => {
        if (!registrationRef.current?.waiting) {
            reloadPage();
            return;
        }
        activationRequestedRef.current = true;
        // workbox 的 controlling 事件在本次会话首次安装后不带 isUpdate，不会触发 onNeedReload
        navigator.serviceWorker.addEventListener(
            "controllerchange",
            reloadPage,
            {
                once: true,
            },
        );
        void updateServiceWorker(true);
    });

    useEffect(() => {
        const markInteracted = () => {
            interactedRef.current = true;
        };
        window.addEventListener("pointerdown", markInteracted, {
            once: true,
            capture: true,
        });
        window.addEventListener("keydown", markInteracted, {
            once: true,
            capture: true,
        });

        const checkForUpdate = () => {
            const registration = registrationRef.current;
            if (registration) updatePwaQuietly(registration);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState !== "visible") return;
            const now = Date.now();
            if (
                now - lastVisibilityCheckRef.current <
                VISIBILITY_CHECK_MIN_INTERVAL_MS
            ) {
                return;
            }
            lastVisibilityCheckRef.current = now;
            checkForUpdate();
        };

        const unsubscribeUpdatePrompt = subscribePwaUpdatePrompt(() =>
            setUpdateReady(true),
        );

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("vite:preloadError", checkForUpdate);
        window.addEventListener("online", checkForUpdate);

        return () => {
            window.removeEventListener("pointerdown", markInteracted, {
                capture: true,
            });
            window.removeEventListener("keydown", markInteracted, {
                capture: true,
            });
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            window.removeEventListener("vite:preloadError", checkForUpdate);
            window.removeEventListener("online", checkForUpdate);
            unsubscribeUpdatePrompt();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!updateReady) return;

        const applyWhenIdle = () => {
            if (activationRequestedRef.current || isAppBusy()) return;
            if (
                document.visibilityState === "hidden" ||
                !interactedRef.current
            ) {
                applyUpdate();
            }
        };

        applyWhenIdle();
        const unsubscribeActivity = subscribeAppActivity(applyWhenIdle);
        document.addEventListener("visibilitychange", applyWhenIdle);
        return () => {
            unsubscribeActivity();
            document.removeEventListener("visibilitychange", applyWhenIdle);
        };
    }, [updateReady]);

    useEffect(() => {
        if (!updateReady) {
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
                onClick: () => applyUpdate(),
            },
            onDismiss: () => setUpdateReady(false),
        });
    }, [updateReady, snackbar]);

    return null;
}

export default PWAPrompt;
