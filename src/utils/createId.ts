// 非安全上下文（如局域网 HTTP）没有 crypto.randomUUID
export const createId = (): string => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};
