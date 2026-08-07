import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef, useState } from "react";
import {
    HOURLY_CHECK_INTERVAL_MS,
    VISIBILITY_CHECK_MIN_INTERVAL_MS,
} from "../constants";
import { Language } from "../types";
import { useTranslation } from "../utils/i18n";

interface PWAPromptProps {
    language: Language;
}

export function PWAPrompt({ language }: PWAPromptProps) {
    // 使用 Ref 存储 SW 注册实例
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastVisibilityCheckRef = useRef<number>(0);
    const [showUpdated, setShowUpdated] = useState(false);
    const t = useTranslation(language);

    useRegisterSW({
        // 注册成功的回调
        onRegistered(r) {
            if (r) {
                registrationRef.current = r;

                // 立即检查一次
                r.update();

                // 设置轮询 (每小时)
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

    // 监听 controllerchange 事件，新 SW 激活时显示提示
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        // 使用 ref 记录 controller 状态
        // 初始值为 true 表示已有 controller (非首次安装)，或者 false (首次安装)
        // 使用 mutable 变量而不是 const，以便在首次安装完成后更新状态，
        // 从而确保后续的版本更新能够正常触发提示。
        let hadController = !!navigator.serviceWorker.controller;

        const handleControllerChange = () => {
            if (!hadController) {
                // 如果之前没有 controller，说明是首次安装引发的变更
                // 忽略本次提示，但标记为已拥有 controller，以便下次更新时提示
                hadController = true;
                return;
            }

            setShowUpdated(true);
        };

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            handleControllerChange,
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                handleControllerChange,
            );
        };
    }, []);

    // 处理可见性变化监听与组件卸载清理
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

    // 只在更新完成时显示提示
    if (!showUpdated) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] p-3 bg-theme-surface border border-theme-primary shadow-lg max-w-xs animate-in slide-in-from-bottom-2 duration-300"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <i className="ri-check-line icon-ui-lg text-theme-success flex-shrink-0" />
                <p className="text-theme-text font-ui-mono text-ui-xs font-bold flex-grow">
                    {t("pwa_updated")}
                </p>
                <button
                    onClick={() => setShowUpdated(false)}
                    className="p-1 hover:bg-theme-primary/10 rounded transition-colors group"
                    aria-label={t("pwa_close") || "Close"}
                    title={t("pwa_close") || "Close"}
                >
                    <i className="ri-close-line icon-ui-lg text-theme-text/60 group-hover:text-theme-text" />
                </button>
            </div>
        </div>
    );
}

export default PWAPrompt;
