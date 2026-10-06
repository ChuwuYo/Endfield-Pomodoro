import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * 未开 vitest globals，手动注册 RTL cleanup。
 */
afterEach(() => {
    cleanup();
});

/**
 * Node 全局 localStorage 未启用时，测试里补一个内存 Storage。
 */
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
