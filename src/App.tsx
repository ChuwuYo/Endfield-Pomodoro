import React, {
    type MutableRefObject,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import pkg from "../package.json";
import Dashboard from "./components/Dashboard";
import FooterStats from "./components/FooterStats";
import HeaderBar from "./components/HeaderBar";
import { PWAPrompt } from "./components/PWAPrompt";
import SettingsPanel from "./components/SettingsPanel";
import { SnackbarProvider, useSnackbar } from "./components/snackbar";
import { BackgroundLayer, ForegroundLayer } from "./components/TerminalUI";
import { MikuDecorations } from "./components/themes";
import { defaultMusicConfig } from "./config/musicConfig";
import { DEFAULT_THEME } from "./config/themes";
import {
    SECONDS_PER_HOUR,
    SECONDS_PER_MINUTE,
    STORAGE_KEYS,
} from "./constants";
import { useAppBusy } from "./hooks/useAppBusy";
import { getThemeExtraSpacing, useFooterHeight } from "./hooks/useFooterHeight";
import { useSessionStats } from "./hooks/useSessionStats";
import type { Settings } from "./types";
import { ThemePreset, TimerMode, View } from "./types";
import { loadCjkFontCss } from "./utils/cjkFont";
import { useTranslation } from "./utils/i18n";
import {
    detectBrowserLanguage,
    languageToHtmlLang,
} from "./utils/languageLocale";
import { parseStoredSettings } from "./utils/settings";
import { applyThemeToRoot } from "./utils/themeDom";
import { runViewTransition } from "./utils/viewTransition";

function SettingsPersistence({
    settings,
    pendingMusicConfigFeedbackRef,
}: {
    settings: Settings;
    pendingMusicConfigFeedbackRef: MutableRefObject<boolean>;
}) {
    const snackbar = useSnackbar();

    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEYS.SETTINGS,
                JSON.stringify(settings),
            );
            if (pendingMusicConfigFeedbackRef.current) {
                pendingMusicConfigFeedbackRef.current = false;
                snackbar.show({
                    id: "music-config-applied",
                    messageKey: "MUSIC_CONFIG_APPLIED",
                    tone: "success",
                });
            }
        } catch (e) {
            console.error("Failed to persist settings", e);
            pendingMusicConfigFeedbackRef.current = false;
            snackbar.show({
                id: "settings-persist-failed",
                messageKey: "SETTINGS_PERSIST_FAILED",
                tone: "warning",
            });
        }
    }, [settings, snackbar, pendingMusicConfigFeedbackRef]);

    return null;
}

const DEFAULT_SETTINGS: Settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: true,
    autoStartWork: true,
    soundEnabled: true,
    soundVolume: 0.5,
    notificationsEnabled: false,
    language: detectBrowserLanguage(),
    theme: DEFAULT_THEME,
    musicConfig: defaultMusicConfig,
};

const App: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(() => {
        const notificationPermission =
            "Notification" in window ? Notification.permission : null;
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        } catch (e) {
            console.error("Failed to load settings", e);
        }
        return parseStoredSettings(saved, DEFAULT_SETTINGS, {
            notificationPermission,
        });
    });

    const [tempMusicConfig, setTempMusicConfig] = useState(
        settings.musicConfig,
    );

    const {
        sessionCount,
        hours,
        minutes,
        seconds,
        isTimerRunning,
        remainingSeconds,
        remainingMode,
        onSessionsUpdate,
        onTick,
    } = useSessionStats(settings.workDuration);
    useAppBusy("timer", isTimerRunning);

    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const { footerRef, footerHeight } = useFooterHeight();

    const t = useTranslation(settings.language);

    const handleMusicConfigChange = (
        key: keyof Settings["musicConfig"],
        value: string,
    ) => {
        setTempMusicConfig((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const pendingMusicConfigFeedbackRef = useRef(false);

    const applyMusicConfig = () => {
        pendingMusicConfigFeedbackRef.current = true;
        setSettings((prev) => ({
            ...prev,
            musicConfig: tempMusicConfig,
        }));
    };

    const appTitle = t("APP_TITLE");
    const appTitleRef = useRef(appTitle);
    useEffect(() => {
        appTitleRef.current = appTitle;
    }, [appTitle]);

    useEffect(() => {
        let nextTitle = appTitle;
        if (document.hidden && isTimerRunning && remainingSeconds != null) {
            const remaining = Math.max(0, remainingSeconds);
            const h = Math.floor(remaining / SECONDS_PER_HOUR);
            const m = Math.floor(
                (remaining % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE,
            );
            const s = remaining % SECONDS_PER_MINUTE;
            const fmt =
                h > 0
                    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
                    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            const modeLabel =
                remainingMode && remainingMode !== TimerMode.WORK
                    ? ` ${t("MODE_BREAK_SHORT")}`
                    : "";
            nextTitle = `${fmt}${modeLabel} • ${appTitle}`;
        }
        if (document.title !== nextTitle) {
            document.title = nextTitle;
        }
    }, [isTimerRunning, remainingSeconds, remainingMode, t, appTitle]);

    useEffect(() => {
        const restoreTitle = () => {
            if (document.title !== appTitleRef.current) {
                document.title = appTitleRef.current;
            }
        };
        const handleVisibility = () => {
            if (!document.hidden) restoreTitle();
        };
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            restoreTitle();
        };
    }, []);

    // 应用主题（首帧由 index.html 内联脚本预先写入，这里负责后续切换）
    useLayoutEffect(() => {
        applyThemeToRoot(settings.theme);
    }, [settings.theme]);

    const handleThemeChange = (theme: ThemePreset) => {
        if (theme === settings.theme) return;
        runViewTransition(
            () => setSettings((prev) => ({ ...prev, theme })),
            "theme",
        );
    };

    const handleViewChange = (view: View) => {
        if (view === currentView) return;
        runViewTransition(() => setCurrentView(view), "view");
    };

    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            // key 为 null 表示 localStorage.clear()，按默认设置处理
            if (e.key !== null && e.key !== STORAGE_KEYS.SETTINGS) return;
            const notificationPermission =
                "Notification" in window ? Notification.permission : null;
            const nextSettings = parseStoredSettings(
                e.newValue,
                DEFAULT_SETTINGS,
                { notificationPermission },
            );
            setSettings(nextSettings);
            setTempMusicConfig(nextSettings.musicConfig);
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    useEffect(() => {
        document.documentElement.lang = languageToHtmlLang(settings.language);
        loadCjkFontCss(settings.language).catch((error: unknown) => {
            console.warn("[Font] CJK font CSS failed to load:", error);
        });
    }, [settings.language]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <SnackbarProvider language={settings.language}>
            <SettingsPersistence
                settings={settings}
                pendingMusicConfigFeedbackRef={pendingMusicConfigFeedbackRef}
            />
            <div className="h-[100dvh] bg-theme-base text-theme-text font-ui-sans selection:bg-theme-primary selection:text-theme-base flex flex-col overflow-hidden transition-colors duration-500 relative cursor-default">
                <BackgroundLayer theme={settings.theme} />

                <MikuDecorations
                    theme={settings.theme}
                    footerHeight={footerHeight}
                />

                <ForegroundLayer theme={settings.theme} />

                <HeaderBar
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    isOnline={isOnline}
                    version={pkg.version}
                    t={t}
                />

                <main
                    className="flex-1 pt-24 md:pt-28 px-4 md:px-12 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col custom-scrollbar"
                    style={{
                        scrollbarGutter: "stable",
                        paddingBottom:
                            footerHeight +
                            getThemeExtraSpacing(
                                settings.theme === ThemePreset.MIKU,
                            ),
                    }}
                >
                    {currentView === View.SETTINGS && (
                        <SettingsPanel
                            settings={settings}
                            tempMusicConfig={tempMusicConfig}
                            onSettingsChange={setSettings}
                            onThemeChange={handleThemeChange}
                            onMusicConfigChange={handleMusicConfigChange}
                            onApplyMusicConfig={applyMusicConfig}
                            onResetMusicConfig={() =>
                                setTempMusicConfig(DEFAULT_SETTINGS.musicConfig)
                            }
                            t={t}
                        />
                    )}
                    <div
                        className={
                            currentView === View.DASHBOARD ? "" : "hidden"
                        }
                    >
                        <Dashboard
                            settings={settings}
                            sessionCount={sessionCount}
                            isOnline={isOnline}
                            onSessionsUpdate={onSessionsUpdate}
                            onTick={onTick}
                        />
                    </div>
                </main>

                <FooterStats
                    footerRef={footerRef}
                    hours={hours}
                    minutes={minutes}
                    seconds={seconds}
                    t={t}
                />

                <PWAPrompt />
            </div>
        </SnackbarProvider>
    );
};

export default App;
