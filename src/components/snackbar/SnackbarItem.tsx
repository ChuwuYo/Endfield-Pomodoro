import type { SnackbarAction, SnackbarTone } from "./snackbarTypes";

type SnackbarItemProps = {
    message: string;
    tone: SnackbarTone;
    action?: SnackbarAction;
    actionLabel?: string;
    dismissLabel: string;
    onAction?: () => void;
    onDismiss: () => void;
};

const toneIcon: Record<SnackbarTone, string> = {
    info: "ri-information-line",
    success: "ri-check-line",
    warning: "ri-alert-line",
    error: "ri-error-warning-line",
};

const toneIconClass: Record<SnackbarTone, string> = {
    info: "text-theme-primary",
    success: "text-theme-success",
    warning: "text-theme-secondary",
    error: "text-theme-error",
};

function snackbarA11y(tone: SnackbarTone): {
    role: "status" | "alert";
    "aria-live": "polite" | "assertive";
} {
    if (tone === "error" || tone === "warning") {
        return { role: "alert", "aria-live": "assertive" };
    }
    return { role: "status", "aria-live": "polite" };
}

export function SnackbarItem({
    message,
    tone,
    action,
    actionLabel,
    dismissLabel,
    onAction,
    onDismiss,
}: SnackbarItemProps) {
    const a11y = snackbarA11y(tone);

    return (
        <div
            className="p-3 bg-theme-surface border border-theme-primary shadow-lg animate-snackbar-in"
            aria-atomic="true"
            {...a11y}
        >
            <div className="flex items-start gap-3">
                <i
                    className={`${toneIcon[tone]} icon-ui-lg ${toneIconClass[tone]} flex-shrink-0 mt-0.5`}
                    aria-hidden="true"
                />
                <div className="flex-grow min-w-0 space-y-2">
                    <p className="text-theme-text font-ui-mono text-ui-xs font-bold">
                        {message}
                    </p>
                    {action && actionLabel && onAction && (
                        <button
                            type="button"
                            onClick={onAction}
                            className="text-ui-micro font-ui-mono px-2 py-1 text-theme-primary border border-theme-primary/50 hover:border-theme-primary hover:bg-theme-primary/10 transition-all rounded-sm cursor-pointer"
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    className="p-1 hover:bg-theme-primary/10 rounded transition-colors group flex-shrink-0 cursor-pointer"
                    aria-label={dismissLabel}
                    title={dismissLabel}
                >
                    <i className="ri-close-line icon-ui-lg text-theme-text/60 group-hover:text-theme-text" />
                </button>
            </div>
        </div>
    );
}
