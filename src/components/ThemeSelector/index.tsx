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
 * 主题选择：明暗图标钮贴死在下拉框左边，只占两个图标位（无字）。
 * 模式只是下拉的筛选条件，切模式不改主题；
 * mode 取初次主题的组，之后只跟随图标钮（主题不动，派生值会把筛选弹回去）。
 *
 * 相邻边框处理（出处见实机注释）：
 * - 两段之间无分隔线：Primer 分段控件两段时即无分隔（选中底色足够区分）。
 * - 焦点环内嵌（outline-offset -1px，同 Primer）：环落在按钮自家框内，
 *   永不漫到邻居/下拉上；W3C F78 禁止拿掉焦点环，故保留而非 outline-none。
 * - 与下拉的接缝：图标组整框 1px + 下拉 -ml-px 压住，共用一条边（同 Primer 负边距拼边）。
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
                    // 与下拉同底（bg-theme-highlight/20），整行读成一个控件；
                    // 右缘不画线，接缝只用下拉框自己的左边框（不叠第二条灰缝）
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
                                onClick={() => setMode(tab.mode)}
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
