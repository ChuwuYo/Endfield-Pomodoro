import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * 本仓库未开启 vitest 的 globals，RTL 因此不会自动注册 cleanup
 * （它依赖全局 afterEach 存在）。在此统一兜底，避免每个测试文件各写一份，
 * 也避免漏写导致组件/hook 实例跨用例存活。
 */
afterEach(() => {
    cleanup();
});

/**
 * Node 22+/26 可能抢占全局 localStorage 名但未启用实现，
 * 导致 jsdom 的 window.localStorage 为 undefined。测试里补一个内存 Storage。
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
