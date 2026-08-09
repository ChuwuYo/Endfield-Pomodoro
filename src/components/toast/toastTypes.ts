import type { TranslationKey } from "../../utils/i18n";

export type ToastTone = "info" | "success" | "warning" | "error";

export type ToastAction = {
    textKey: TranslationKey;
    onClick: () => void;
};

export type ToastShowOptions = {
    /** 稳定去重键；省略则每次新建 */
    id?: string;
    messageKey: TranslationKey;
    tone?: ToastTone;
    action?: ToastAction;
    /**
     * 自动关闭时长。
     * - 省略：使用 TOAST_DEFAULT_DURATION_MS
     * - null：持久，直到用户关闭或 dismiss
     */
    durationMs?: number | null;
    onDismiss?: () => void;
};

export type ToastRecord = {
    id: string;
    messageKey: TranslationKey;
    tone: ToastTone;
    action?: ToastAction;
    durationMs: number | null;
    onDismiss?: () => void;
};

export type ToastApi = {
    show: (options: ToastShowOptions) => string;
    dismiss: (id: string) => void;
};
