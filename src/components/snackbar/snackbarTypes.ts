import type { TranslationKey } from "../../utils/i18n";

export type SnackbarTone = "info" | "success" | "warning" | "error";

export type SnackbarAction = {
    textKey: TranslationKey;
    onClick: () => void;
};

export type SnackbarShowOptions = {
    /** 稳定去重键；省略则每次新建 */
    id?: string;
    messageKey: TranslationKey;
    tone?: SnackbarTone;
    action?: SnackbarAction;
    /**
     * 自动关闭时长。
     * - 省略：无 action → SNACKBAR_DEFAULT_DURATION_MS；有 action → 常驻（null）
     * - null：持久，直到用户关闭、点 action 或 dismiss
     */
    durationMs?: number | null;
    onDismiss?: () => void;
};

export type SnackbarRecord = {
    id: string;
    messageKey: TranslationKey;
    tone: SnackbarTone;
    action?: SnackbarAction;
    durationMs: number | null;
    onDismiss?: () => void;
};

export type SnackbarApi = {
    show: (options: SnackbarShowOptions) => string;
    dismiss: (id: string) => void;
};
