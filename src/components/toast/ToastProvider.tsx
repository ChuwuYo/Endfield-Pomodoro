import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import {
    TOAST_DEFAULT_DURATION_MS,
    TOAST_MAX_VISIBLE,
} from "../../config/toastConfig";
import { Language } from "../../types";
import { createId } from "../../utils/createId";
import { useTranslation } from "../../utils/i18n";
import { ToastItem } from "./ToastItem";
import { upsertToast } from "./toastQueue";
import type { ToastApi, ToastRecord, ToastShowOptions } from "./toastTypes";
import { ToastContext } from "./useToast";

type ToastProviderProps = {
    language: Language;
    children: ReactNode;
};

export function ToastProvider({ language, children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    /** 队列权威快照：连续 show/dismiss 在重渲染前也保持正确衔接 */
    const toastsRef = useRef<ToastRecord[]>([]);
    const timersRef = useRef<Map<string, number>>(new Map());
    const onDismissRef = useRef<Map<string, (() => void) | undefined>>(
        new Map(),
    );
    const t = useTranslation(language);

    const clearTimer = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer != null) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const releaseDropped = useCallback(
        (dropped: ToastRecord[]) => {
            for (const old of dropped) {
                clearTimer(old.id);
                const onDismiss = onDismissRef.current.get(old.id);
                onDismissRef.current.delete(old.id);
                if (onDismiss) {
                    queueMicrotask(onDismiss);
                }
            }
        },
        [clearTimer],
    );

    const dismiss = useCallback(
        (id: string) => {
            clearTimer(id);
            const onDismiss = onDismissRef.current.get(id);
            onDismissRef.current.delete(id);
            const next = toastsRef.current.filter((toast) => toast.id !== id);
            toastsRef.current = next;
            setToasts(next);
            onDismiss?.();
        },
        [clearTimer],
    );

    const show = useCallback(
        (options: ToastShowOptions) => {
            const id = options.id ?? createId();
            const durationMs =
                options.durationMs === undefined
                    ? TOAST_DEFAULT_DURATION_MS
                    : options.durationMs;

            const record: ToastRecord = {
                id,
                messageKey: options.messageKey,
                tone: options.tone ?? "info",
                action: options.action,
                durationMs,
                onDismiss: options.onDismiss,
            };

            onDismissRef.current.set(id, options.onDismiss);

            const prev = toastsRef.current;
            const next = upsertToast(prev, record, TOAST_MAX_VISIBLE);
            const dropped = prev.filter(
                (old) => !next.some((toast) => toast.id === old.id),
            );
            toastsRef.current = next;
            setToasts(next);
            releaseDropped(dropped);

            clearTimer(id);
            if (durationMs != null && durationMs > 0) {
                timersRef.current.set(
                    id,
                    window.setTimeout(() => dismiss(id), durationMs),
                );
            }

            return id;
        },
        [clearTimer, dismiss, releaseDropped],
    );

    useEffect(() => {
        const timers = timersRef.current;
        const onDismissHandlers = onDismissRef.current;
        return () => {
            for (const timer of timers.values()) {
                clearTimeout(timer);
            }
            timers.clear();
            onDismissHandlers.clear();
        };
    }, []);

    const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <div
                    className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-xs pointer-events-none"
                    data-toast-viewport
                >
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem
                                message={t(toast.messageKey)}
                                tone={toast.tone}
                                action={toast.action}
                                actionLabel={
                                    toast.action
                                        ? t(toast.action.textKey)
                                        : undefined
                                }
                                dismissLabel={t("CLOSE")}
                                onAction={
                                    toast.action
                                        ? () => {
                                              toast.action?.onClick();
                                              dismiss(toast.id);
                                          }
                                        : undefined
                                }
                                onDismiss={() => dismiss(toast.id)}
                            />
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
}
