import React, { useId, useState } from "react";
import { ThemeMode, themeModeOf } from "../../config/themes";
import type { Settings } from "../../types";
import { ThemePreset } from "../../types";
import { useTranslation } from "../../utils/i18n";
import { CustomSelect } from "../CustomSelect";

type ThemeSelectorProps = {
    theme: Settings["theme"];
    onThemeChange: (theme: ThemePreset) => void;
    t: ReturnType<typeof useTranslation>;
};

const themeOptionsOf = (
    t: ThemeSelectorProps["t"],
): { value: ThemePreset; label: string }[] => [
    { value: ThemePreset.ORIGIN, label: t("THEME_ORIGIN") },
    { value: ThemePreset.ABYSSAL, label: t("THEME_ABYSSAL") },
    { value: ThemePreset.NEON, label: t("THEME_NEON") },
    { value: ThemePreset.MATRIX, label: t("THEME_MATRIX") },
    { value: ThemePreset.TACTICAL, label: t("THEME_TACTICAL") },
    { value: ThemePreset.INDUSTRIAL, label: t("THEME_INDUSTRIAL") },
    { value: ThemePreset.AZURE, label: t("THEME_AZURE") },
    { value: ThemePreset.MIKU, label: t("THEME_MIKU") },
];

/**
 * 主题选择：明暗图标 + 下拉框（贴框一行，焦点环内嵌）。
 * 模式只筛选下拉，不改主题。
 */
export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
    theme,
    onThemeChange,
    t,
}) => {
    const [mode, setMode] = useState<ThemeMode>(() => themeModeOf(theme));
    const idPrefix = useId();
    const themeLabelId = `${idPrefix}-theme-label`;
    const themeSelectId = `${idPrefix}-theme`;

    const options = themeOptionsOf(t);
    const visibleOptions = options.filter(
        (option) => themeModeOf(option.value) === mode,
    );
    // 选中显示走全量找 label，不受筛选影响
    const currentLabel = options.find(
        (option) => option.value === theme,
    )?.label;

    return (
        <div>
            <label
                id={themeLabelId}
                htmlFor={themeSelectId}
                className="block text-ui-micro font-ui-mono text-theme-dim mb-2 uppercase tracking-ui-wider"
            >
                {t("THEME")}
            </label>
            <div className="flex">
                <div
                    role="group"
                    aria-label={t("THEME_MODE")}
                    // 与下拉同底同框
                    className="flex shrink-0 items-stretch border-l border-y border-theme-highlight bg-theme-highlight/20 h-form-control"
                >
                    {(
                        [
                            {
                                mode: ThemeMode.LIGHT,
                                labelKey: "THEME_MODE_LIGHT",
                                icon: "ri-sun-line",
                            },
                            {
                                mode: ThemeMode.DARK,
                                labelKey: "THEME_MODE_DARK",
                                icon: "ri-moon-line",
                            },
                        ] as const
                    ).map((tab) => {
                        const active = tab.mode === mode;
                        return (
                            <button
                                key={tab.mode}
                                type="button"
                                aria-pressed={active}
                                aria-label={t(tab.labelKey)}
                                title={t(tab.labelKey)}
                                onClick={(e) => {
                                    setMode(tab.mode);
                                    // 指针点击后把焦点移到下拉：焦点环标示
                                    // "筛选已作用于它"。键盘激活（detail 0）
                                    // 不移，焦点留在模式组里可继续按键。
                                    if (e.detail > 0) {
                                        document
                                            .getElementById(themeSelectId)
                                            ?.focus();
                                    }
                                }}
                                className={`w-10 grid place-items-center transition-colors cursor-pointer focus-visible:outline-offset-[-1px] ${
                                    active
                                        ? "bg-theme-primary text-theme-base"
                                        : "bg-transparent text-theme-dim hover:text-theme-primary"
                                }`}
                            >
                                <i
                                    className={`${tab.icon} icon-ui-lg`}
                                    aria-hidden="true"
                                ></i>
                            </button>
                        );
                    })}
                </div>
                <CustomSelect
                    id={themeSelectId}
                    aria-labelledby={themeLabelId}
                    value={theme}
                    options={visibleOptions}
                    displayLabel={currentLabel}
                    onChange={(value) => onThemeChange(value as ThemePreset)}
                    className="flex-1 min-w-0"
                />
            </div>
        </div>
    );
};
