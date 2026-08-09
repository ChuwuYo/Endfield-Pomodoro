import type { TranslationKey } from "../../utils/i18n";

export type SnackbarTone = "info" | "success" | "warning" | "error";

/** 条上可选的一枚操作按钮（如「切换至在线」「刷新页面」） */
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
     * - 省略：使用 SNACKBAR_DEFAULT_DURATION_MS
     * - null：持久，直到用户关闭或 dismiss
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
