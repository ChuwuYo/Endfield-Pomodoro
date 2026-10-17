/** limit <= 0 时不限并发 */
export async function asyncPool<T, R>(
    limit: number,
    items: T[],
    fn: (item: T) => Promise<R>,
): Promise<R[]> {
    if (limit <= 0) {
        return Promise.all(items.map((item) => fn(item)));
    }

    const ret: Promise<R>[] = [];
    const executing = new Set<Promise<R>>();

    for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        ret.push(p);

        const e: Promise<R> = p.finally(() => executing.delete(e));
        executing.add(e);
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    return Promise.all(ret);
}
