import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { Language } from "../../types";
import { ToastProvider } from "./ToastProvider";
import type { ToastApi } from "./toastTypes";
import { useToast } from "./useToast";

function ToastApiProbe({ onReady }: { onReady: (api: ToastApi) => void }) {
    const toast = useToast();
    useEffect(() => {
        onReady(toast);
    }, [toast, onReady]);
    return null;
}

describe("ToastProvider overflow", () => {
    it("fires onDismiss when a toast is dropped by the visible cap", async () => {
        const onDismissOldest = vi.fn();
        let api: ToastApi | undefined;

        render(
            <ToastProvider language={Language.EN}>
                <ToastApiProbe
                    onReady={(toastApi) => {
                        api = toastApi;
                    }}
                />
            </ToastProvider>,
        );

        await waitFor(() => {
            expect(api).toBeDefined();
        });

        api!.show({
            id: "oldest",
            messageKey: "NETWORK_RESTORED",
            durationMs: null,
            onDismiss: onDismissOldest,
        });
        api!.show({
            id: "mid",
            messageKey: "CONNECTING",
            durationMs: null,
        });
        api!.show({
            id: "newer",
            messageKey: "pwa_updated",
            durationMs: null,
        });
        api!.show({
            id: "newest",
            messageKey: "NOTIFICATION_PERMISSION_DENIED",
            durationMs: null,
        });

        await waitFor(() => {
            expect(onDismissOldest).toHaveBeenCalledTimes(1);
        });
    });
});
