/**
 * 纯队列策略：同 id 替换；超过上限时丢掉最旧条目。
 */
export function upsertToast<T extends { id: string }>(
    toasts: T[],
    next: T,
    maxVisible: number,
): T[] {
    const without = toasts.filter((toast) => toast.id !== next.id);
    const merged = [...without, next];
    if (merged.length <= maxVisible) {
        return merged;
    }
    return merged.slice(merged.length - maxVisible);
}
