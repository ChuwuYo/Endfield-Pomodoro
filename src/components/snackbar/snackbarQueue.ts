export function upsertSnackbar<T extends { id: string }>(
    items: T[],
    next: T,
    maxVisible: number,
): T[] {
    const without = items.filter((item) => item.id !== next.id);
    const merged = [...without, next];
    if (merged.length <= maxVisible) {
        return merged;
    }
    return merged.slice(merged.length - maxVisible);
}
