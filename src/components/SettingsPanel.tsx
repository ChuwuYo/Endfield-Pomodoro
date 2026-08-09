import React, { useId } from "react";
import type { Settings } from "../types";
import { Language, ThemePreset } from "../types";
import { useTranslation } from "../utils/i18n";
import { parseDurationInput } from "../utils/settings";
import { Checkbox } from "./Checkbox";
import { CustomSelect } from "./CustomSelect";
import { useToast } from "./toast";
import { Button, Input, Panel } from "./ui";

type SettingsPanelProps = {
    settings: Settings;
    tempMusicConfig: Settings["musicConfig"];
    onSettingsChange: React.Dispatch<React.SetStateAction<Settings>>;
    onMusicConfigChange: (
        key: keyof Settings["musicConfig"],
        value: string,
    ) => void;
    onApplyMusicConfig: () => void;
    onResetMusicConfig: () => void;
    t: ReturnType<typeof useTranslation>;
};

const getMusicPlatformOptions = (t: ReturnType<typeof useTranslation>) => [
    { value: "netease", label: t("PLATFORM_NETEASE") },
    { value: "tencent", label: t("PLATFORM_TENCENT") },
    { value: "kugou", label: t("PLATFORM_KUGOU") },
    { value: "baidu", label: t("PLATFORM_BAIDU") },
    { value: "kuwo", label: t("PLATFORM_KUWO") },
];

const getMusicTypeOptions = (t: ReturnType<typeof useTranslation>) => [
    { value: "playlist", label: t("TYPE_PLAYLIST") },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    settings,
    tempMusicConfig,
    onSettingsChange,
    onMusicConfigChange,
    onApplyMusicConfig,
    onResetMusicConfig,
    t,
}) => {
    const toast = useToast();
    const idPrefix = useId();
    const workId = `${idPrefix}-work`;
    const shortBreakId = `${idPrefix}-short-break`;
    const longBreakId = `${idPrefix}-long-break`;
    const languageId = `${idPrefix}-language`;
    const themeId = `${idPrefix}-theme`;
    const platformId = `${idPrefix}-platform`;
    const typeId = `${idPrefix}-type`;
    const musicId = `${idPrefix}-music-id`;
    const languageLabelId = `${idPrefix}-language-label`;
    const themeLabelId = `${idPrefix}-theme-label`;
    const platformLabelId = `${idPrefix}-platform-label`;
    const typeLabelId = `${idPrefix}-type-label`;

    return (
        <div className="max-w-4xl mx-auto w-full pt-6 px-2">
            <Panel
                title={t("SYSTEM_CONFIG")}
                className="p-4 md:p-8 backdrop-blur-xl bg-theme-surface/80 mt-2"
            >
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-theme-primary font-ui-mono text-ui-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                            <span>{t("CYCLE_PARAMETERS")}</span>
                            <span className="text-ui-micro opacity-50">
                                CONFIG_SECTOR_01
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label
                                    htmlFor={workId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("WORK_DURATION")}
                                </label>
                                <Input
                                    id={workId}
                                    type="number"
                                    min={1}
                                    value={settings.workDuration}
                                    onChange={(e) =>
                                        onSettingsChange({
                                            ...settings,
                                            workDuration: parseDurationInput(
                                                e.target.value,
                                                settings.workDuration,
                                            ),
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor={shortBreakId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("SHORT_BREAK_DURATION")}
                                </label>
                                <Input
                                    id={shortBreakId}
                                    type="number"
                                    min={1}
                                    value={settings.shortBreakDuration}
                                    onChange={(e) =>
                                        onSettingsChange({
                                            ...settings,
                                            shortBreakDuration:
                                                parseDurationInput(
                                                    e.target.value,
                                                    settings.shortBreakDuration,
                                                ),
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor={longBreakId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("LONG_BREAK_DURATION")}
                                </label>
                                <Input
                                    id={longBreakId}
                                    type="number"
                                    min={1}
                                    value={settings.longBreakDuration}
                                    onChange={(e) =>
                                        onSettingsChange({
                                            ...settings,
                                            longBreakDuration:
                                                parseDurationInput(
                                                    e.target.value,
                                                    settings.longBreakDuration,
                                                ),
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-theme-primary font-ui-mono text-ui-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                            <span>{t("INTERFACE_CUSTOMIZATION")}</span>
                            <span className="text-ui-micro opacity-50">
                                CONFIG_SECTOR_02
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label
                                    id={languageLabelId}
                                    htmlFor={languageId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("LANGUAGE")}
                                </label>
                                <CustomSelect
                                    id={languageId}
                                    aria-labelledby={languageLabelId}
                                    value={settings.language}
                                    options={[
                                        {
                                            value: Language.EN,
                                            label: "ENGLISH (US)",
                                        },
                                        {
                                            value: Language.CN,
                                            label: "简体中文 (CN)",
                                        },
                                    ]}
                                    onChange={(value) =>
                                        onSettingsChange({
                                            ...settings,
                                            language: value as Language,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    id={themeLabelId}
                                    htmlFor={themeId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("THEME")}
                                </label>
                                <CustomSelect
                                    id={themeId}
                                    aria-labelledby={themeLabelId}
                                    value={settings.theme}
                                    options={[
                                        {
                                            value: ThemePreset.ORIGIN,
                                            label: t("THEME_ORIGIN"),
                                        },
                                        {
                                            value: ThemePreset.ABYSSAL,
                                            label: t("THEME_ABYSSAL"),
                                        },
                                        {
                                            value: ThemePreset.NEON,
                                            label: t("THEME_NEON"),
                                        },
                                        {
                                            value: ThemePreset.MATRIX,
                                            label: t("THEME_MATRIX"),
                                        },
                                        {
                                            value: ThemePreset.TACTICAL,
                                            label: t("THEME_TACTICAL"),
                                        },
                                        {
                                            value: ThemePreset.ROYAL,
                                            label: t("THEME_ROYAL"),
                                        },
                                        {
                                            value: ThemePreset.INDUSTRIAL,
                                            label: t("THEME_INDUSTRIAL"),
                                        },
                                        {
                                            value: ThemePreset.AZURE,
                                            label: t("THEME_AZURE"),
                                        },
                                        {
                                            value: ThemePreset.MIKU,
                                            label: t("THEME_MIKU"),
                                        },
                                    ]}
                                    onChange={(value) =>
                                        onSettingsChange({
                                            ...settings,
                                            theme: value as ThemePreset,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-theme-primary font-ui-mono text-ui-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                            <span>{t("AUTOMATION_FEEDBACK")}</span>
                            <span className="text-ui-micro opacity-50">
                                CONFIG_SECTOR_03
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Checkbox
                                checked={settings.autoStartBreaks}
                                onChange={(checked) =>
                                    onSettingsChange({
                                        ...settings,
                                        autoStartBreaks: checked,
                                    })
                                }
                                label={t("AUTO_START_BREAK")}
                            />
                            <Checkbox
                                checked={settings.autoStartWork}
                                onChange={(checked) =>
                                    onSettingsChange({
                                        ...settings,
                                        autoStartWork: checked,
                                    })
                                }
                                label={t("AUTO_START_WORK")}
                            />
                            <Checkbox
                                checked={settings.soundEnabled}
                                onChange={(checked) =>
                                    onSettingsChange({
                                        ...settings,
                                        soundEnabled: checked,
                                    })
                                }
                                label={t("AUDIO_FEEDBACK")}
                            />
                            <Checkbox
                                checked={settings.notificationsEnabled}
                                onChange={async (checked) => {
                                    if (
                                        !checked ||
                                        !("Notification" in window)
                                    ) {
                                        onSettingsChange((prev) => ({
                                            ...prev,
                                            notificationsEnabled: false,
                                        }));
                                        return;
                                    }

                                    let permission = Notification.permission;
                                    if (permission === "default") {
                                        try {
                                            permission =
                                                await Notification.requestPermission();
                                        } catch (err) {
                                            console.error(
                                                "Failed to request notification permission",
                                                err,
                                            );
                                            permission = "denied";
                                        }
                                    }

                                    if (permission === "denied") {
                                        toast.show({
                                            id: "notification-permission-denied",
                                            messageKey:
                                                "NOTIFICATION_PERMISSION_DENIED",
                                            tone: "warning",
                                        });
                                    }

                                    onSettingsChange((prev) => ({
                                        ...prev,
                                        notificationsEnabled:
                                            permission === "granted",
                                    }));
                                }}
                                label={t("NOTIFICATIONS_ENABLED")}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-theme-primary font-ui-mono text-ui-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                            <span>{t("ONLINE_MUSIC_CONFIG")}</span>
                            <span className="text-ui-micro opacity-50">
                                CONFIG_SECTOR_04
                            </span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label
                                    id={platformLabelId}
                                    htmlFor={platformId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("PLATFORM")}
                                </label>
                                <CustomSelect
                                    id={platformId}
                                    aria-labelledby={platformLabelId}
                                    value={tempMusicConfig.server}
                                    options={getMusicPlatformOptions(t)}
                                    onChange={(value) =>
                                        onMusicConfigChange("server", value)
                                    }
                                />
                                <div className="mt-2 text-ui-sm text-theme-primary font-ui-mono inline-flex items-center gap-1 px-2 py-1 border border-theme-highlight/80 bg-theme-surface/20">
                                    <i
                                        className="ri-alarm-warning-line icon-ui-sm"
                                        aria-hidden="true"
                                    ></i>
                                    <span>{t("PLATFORM_NOTICE")}</span>
                                </div>
                            </div>
                            <div>
                                <label
                                    id={typeLabelId}
                                    htmlFor={typeId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("TYPE")}
                                </label>
                                <CustomSelect
                                    id={typeId}
                                    aria-labelledby={typeLabelId}
                                    value={tempMusicConfig.type}
                                    options={getMusicTypeOptions(t)}
                                    onChange={(value) =>
                                        onMusicConfigChange("type", value)
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor={musicId}
                                    className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
                                >
                                    {t("ID")}
                                </label>
                                <Input
                                    id={musicId}
                                    type="text"
                                    value={tempMusicConfig.id}
                                    onChange={(e) =>
                                        onMusicConfigChange(
                                            "id",
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t("ENTER_ID_PLACEHOLDER")}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={onResetMusicConfig}
                                className="px-4 py-1.5 text-ui-xs font-ui-mono tracking-ui-wider"
                                title={t("RESET_MUSIC_CONFIG")}
                                aria-label={t("RESET_MUSIC_CONFIG")}
                            >
                                <i className="ri-refresh-line icon-ui-md"></i>
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    onApplyMusicConfig();
                                    toast.show({
                                        id: "music-config-applied",
                                        messageKey: "MUSIC_CONFIG_APPLIED",
                                        tone: "success",
                                    });
                                }}
                                className="px-6 py-1.5 text-ui-xs font-ui-mono tracking-ui-wider"
                            >
                                {t("APPLY_SETTINGS")}
                            </Button>
                        </div>
                    </div>
                </div>
            </Panel>
        </div>
    );
};

export default SettingsPanel;
