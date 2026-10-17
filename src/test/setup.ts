import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 未开 vitest globals，需手动注册 cleanup
afterEach(() => {
    cleanup();
});

// Node 未启用全局 localStorage 时补一个内存实现
const installMemoryLocalStorage = () => {
    if (typeof window === "undefined") return;
    if (
        window.localStorage &&
        typeof window.localStorage.getItem === "function"
    ) {
        return;
    }

    const store = new Map<string, string>();
    const memoryStorage: Storage = {
        get length() {
            return store.size;
        },
        clear() {
            store.clear();
        },
        getItem(key: string) {
            return store.has(key) ? store.get(key)! : null;
        },
        key(index: number) {
            return Array.from(store.keys())[index] ?? null;
        },
        removeItem(key: string) {
            store.delete(key);
        },
        setItem(key: string, value: string) {
            store.set(key, String(value));
        },
    };

    Object.defineProperty(window, "localStorage", {
        configurable: true,
        enumerable: true,
        value: memoryStorage,
    });
};

installMemoryLocalStorage();
