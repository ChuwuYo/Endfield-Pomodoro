const busyKeys = new Set<string>();
const listeners = new Set<() => void>();

/** 标记应用是否有刷新会丢失的进行中状态（计时、播放、本地歌单） */
export const setAppBusy = (key: string, busy: boolean): void => {
    if (busyKeys.has(key) === busy) return;
    if (busy) busyKeys.add(key);
    else busyKeys.delete(key);
    for (const listener of listeners) listener();
};

export const isAppBusy = (): boolean => busyKeys.size > 0;

export const subscribeAppActivity = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
