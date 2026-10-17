import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PWAPrompt } from "./PWAPrompt";

type CapturedRegisterOptions = {
    onNeedReload?: () => void;
    onRegisteredSW?: (
        swUrl: string,
        registration: ServiceWorkerRegistration | undefined,
    ) => void;
};

const mocks = vi.hoisted(() => ({
    options: undefined as CapturedRegisterOptions | undefined,
    show: vi.fn(() => "pwa-updated"),
    dismiss: vi.fn(),
    reload: vi.fn(),
}));

vi.mock("virtual:pwa-register/react", () => ({
    useRegisterSW: (options: CapturedRegisterOptions) => {
        mocks.options = options;
        return {
            needRefresh: [false, vi.fn()],
            offlineReady: [false, vi.fn()],
            updateServiceWorker: vi.fn(),
        };
    },
}));

vi.mock("./snackbar", () => ({
    useSnackbar: () => ({ show: mocks.show, dismiss: mocks.dismiss }),
}));

vi.mock("../utils/pwaUpdate", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../utils/pwaUpdate")>()),
    reloadPage: mocks.reload,
}));

const setVisibilityState = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
    });
    document.dispatchEvent(new Event("visibilitychange"));
};

const fireNeedReload = () => {
    act(() => {
        mocks.options?.onNeedReload?.();
    });
};

describe("PWAPrompt update application", () => {
    beforeEach(() => {
        mocks.options = undefined;
    });

    afterEach(() => {
        vi.clearAllMocks();
        Reflect.deleteProperty(document, "visibilityState");
    });

    it("reloads right away when the page is already hidden", () => {
        render(<PWAPrompt />);
        setVisibilityState("hidden");

        fireNeedReload();

        expect(mocks.reload).toHaveBeenCalledTimes(1);
        expect(mocks.show).not.toHaveBeenCalled();
    });

    it("defers the reload to the next hide while the page is visible", () => {
        render(<PWAPrompt />);
        setVisibilityState("visible");

        fireNeedReload();

        expect(mocks.reload).not.toHaveBeenCalled();
        expect(mocks.show).toHaveBeenCalledWith(
            expect.objectContaining({ id: "pwa-updated" }),
        );

        setVisibilityState("hidden");

        expect(mocks.reload).toHaveBeenCalledTimes(1);
    });

    it("checks for an update when a dynamic import fails", () => {
        const update = vi.fn(() => Promise.resolve());
        render(<PWAPrompt />);
        act(() => {
            mocks.options?.onRegisteredSW?.("/sw.js", {
                update,
            } as unknown as ServiceWorkerRegistration);
        });
        update.mockClear();

        window.dispatchEvent(new Event("vite:preloadError"));

        expect(update).toHaveBeenCalledTimes(1);
        expect(mocks.reload).not.toHaveBeenCalled();
    });

    it("leaves a pending update to the next hide when a dynamic import fails", () => {
        const update = vi.fn(() => Promise.resolve());
        render(<PWAPrompt />);
        setVisibilityState("visible");
        act(() => {
            mocks.options?.onRegisteredSW?.("/sw.js", {
                update,
            } as unknown as ServiceWorkerRegistration);
        });
        update.mockClear();
        fireNeedReload();

        window.dispatchEvent(new Event("vite:preloadError"));

        expect(update).not.toHaveBeenCalled();
        expect(mocks.reload).not.toHaveBeenCalled();
    });
});
