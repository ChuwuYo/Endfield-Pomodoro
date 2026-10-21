import type React from "react";
import {
    type ManualUpdateCheckStatus,
    useManualUpdateCheck,
} from "../hooks/useManualUpdateCheck";
import type { TranslationKey, useTranslation } from "../utils/i18n";
import {
    getPwaRegistration,
    type ManualUpdateCheckResult,
    requestPwaUpdatePrompt,
} from "../utils/pwaRegistration";
import { type SnackbarTone, useSnackbar } from "./snackbar";
import { Button } from "./ui";

const MANUAL_UPDATE_SNACKBAR_ID = "pwa-manual-update-check";

const STATUS_VIEW: Record<
    ManualUpdateCheckStatus,
    { labelKey: TranslationKey; icon: string }
> = {
    idle: { labelKey: "CHECK_UPDATE", icon: "ri-refresh-line" },
    checking: {
        labelKey: "CHECKING_UPDATE",
        icon: "ri-loader-4-line animate-spin",
    },
    latest: { labelKey: "UPDATE_LATEST", icon: "ri-checkbox-circle-line" },
    found: { labelKey: "UPDATE_FOUND", icon: "ri-download-2-line" },
    offline: { labelKey: "UPDATE_OFFLINE", icon: "ri-wifi-off-line" },
    error: { labelKey: "UPDATE_CHECK_FAILED", icon: "ri-error-warning-line" },
};

const RESULT_SNACKBAR: Record<
    ManualUpdateCheckResult,
    { messageKey: TranslationKey; tone: SnackbarTone }
> = {
    latest: { messageKey: "UPDATE_LATEST_MESSAGE", tone: "success" },
    found: { messageKey: "UPDATE_FOUND_MESSAGE", tone: "info" },
    offline: { messageKey: "UPDATE_CHECK_OFFLINE_MESSAGE", tone: "warning" },
    error: { messageKey: "UPDATE_CHECK_FAILED_MESSAGE", tone: "warning" },
};

type SettingsUpdateSectionProps = {
    t: ReturnType<typeof useTranslation>;
};

export const SettingsUpdateSection: React.FC<SettingsUpdateSectionProps> = ({
    t,
}) => {
    const snackbar = useSnackbar();
    const { available, status, check } = useManualUpdateCheck((result) => {
        if (result === "found" && getPwaRegistration()?.waiting) {
            snackbar.dismiss(MANUAL_UPDATE_SNACKBAR_ID);
            requestPwaUpdatePrompt();
            return;
        }
        snackbar.show({
            id: MANUAL_UPDATE_SNACKBAR_ID,
            ...RESULT_SNACKBAR[result],
        });
    });

    if (!available) return null;

    const view = STATUS_VIEW[status];
    const isChecking = status === "checking";

    return (
        <div className="space-y-4">
            <h3 className="text-theme-primary font-ui-mono text-ui-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                <span>{t("APP_UPDATE")}</span>
                <span className="text-ui-micro opacity-50">
                    CONFIG_SECTOR_05
                </span>
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <span className="block text-ui-micro font-ui-mono text-theme-dim uppercase tracking-ui-wider">
                    {t("CHECK_UPDATE_HINT")}
                </span>
                <Button
                    variant="secondary"
                    onClick={check}
                    disabled={isChecking}
                    aria-busy={isChecking}
                    className="px-4 py-1.5 text-ui-xs font-ui-mono tracking-ui-wider w-fit self-end md:self-auto"
                >
                    <i
                        className={`${view.icon} icon-ui-md`}
                        aria-hidden="true"
                    ></i>
                    <span>{t(view.labelKey)}</span>
                </Button>
            </div>
        </div>
    );
};

export default SettingsUpdateSection;
