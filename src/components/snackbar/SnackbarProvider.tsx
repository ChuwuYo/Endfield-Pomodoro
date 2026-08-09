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
    SNACKBAR_DEFAULT_DURATION_MS,
    SNACKBAR_MAX_VISIBLE,
} from "../../config/snackbarConfig";
import { Language } from "../../types";
import { createId } from "../../utils/createId";
import { useTranslation } from "../../utils/i18n";
import { SnackbarItem } from "./SnackbarItem";
import { upsertSnackbar } from "./snackbarQueue";
import type {
    SnackbarApi,
    SnackbarRecord,
    SnackbarShowOptions,
} from "./snackbarTypes";
import { SnackbarContext } from "./useSnackbar";

type SnackbarProviderProps = {
    language: Language;
    children: ReactNode;
};

export function SnackbarProvider({
    language,
    children,
}: SnackbarProviderProps) {
    const [items, setItems] = useState<SnackbarRecord[]>([]);
    /** 队列权威快照：连续 show/dismiss 在重渲染前也保持正确衔接 */
    const itemsRef = useRef<SnackbarRecord[]>([]);
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
        (dropped: SnackbarRecord[]) => {
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
            const next = itemsRef.current.filter((item) => item.id !== id);
            itemsRef.current = next;
            setItems(next);
            onDismiss?.();
        },
        [clearTimer],
    );

    const show = useCallback(
        (options: SnackbarShowOptions) => {
            const id = options.id ?? createId();
            const durationMs =
                options.durationMs === undefined
                    ? SNACKBAR_DEFAULT_DURATION_MS
                    : options.durationMs;

            const record: SnackbarRecord = {
                id,
                messageKey: options.messageKey,
                tone: options.tone ?? "info",
                action: options.action,
                durationMs,
                onDismiss: options.onDismiss,
            };

            onDismissRef.current.set(id, options.onDismiss);

            const prev = itemsRef.current;
            const next = upsertSnackbar(prev, record, SNACKBAR_MAX_VISIBLE);
            const dropped = prev.filter(
                (old) => !next.some((item) => item.id === old.id),
            );
            itemsRef.current = next;
            setItems(next);
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

    const api = useMemo<SnackbarApi>(
        () => ({ show, dismiss }),
        [show, dismiss],
    );

    return (
        <SnackbarContext.Provider value={api}>
            {children}
            {createPortal(
                <div
                    className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 max-w-xs pointer-events-none"
                    data-snackbar-viewport
                >
                    {items.map((item) => (
                        <div key={item.id} className="pointer-events-auto">
                            <SnackbarItem
                                message={t(item.messageKey)}
                                tone={item.tone}
                                action={item.action}
                                actionLabel={
                                    item.action
                                        ? t(item.action.textKey)
                                        : undefined
                                }
                                dismissLabel={t("CLOSE")}
                                onAction={
                                    item.action
                                        ? () => {
                                              item.action?.onClick();
                                              dismiss(item.id);
                                          }
                                        : undefined
                                }
                                onDismiss={() => dismiss(item.id)}
                            />
                        </div>
                    ))}
                </div>,
                document.body,
            )}
        </SnackbarContext.Provider>
    );
}
