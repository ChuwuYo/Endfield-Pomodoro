import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PWAPrompt } from "./PWAPrompt";

type CapturedRegisterOptions = {
    onNeedReload?: () => void;
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

// 只 mock 掉刷新，其余走真实实现
vi.mock("../utils/pwaUpdate", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../utils/pwaUpdate")>()),
    reloadPage: mocks.reload,
}));

/** 覆盖 jsdom 的可见性状态，并触发 visibilitychange */
const setVisibilityState = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
    });
    document.dispatchEvent(new Event("visibilitychange"));
};

/** 模拟 workbox-window 的 activated(isUpdate) */
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
});
