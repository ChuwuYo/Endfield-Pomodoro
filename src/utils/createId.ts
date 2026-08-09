/**
 * Stable-enough unique id for client-side records.
 * Prefer `crypto.randomUUID` when available; fall back outside secure contexts
 * (e.g. Vite over LAN HTTP) where the UUID API is missing.
 */
export const createId = (): string => {
    if (typeof globalThis.crypto?.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};
