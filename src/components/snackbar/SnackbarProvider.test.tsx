import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { Language } from "../../types";
import { SnackbarProvider } from "./SnackbarProvider";
import type { SnackbarApi } from "./snackbarTypes";
import { useSnackbar } from "./useSnackbar";

function SnackbarApiProbe({
    onReady,
}: {
    onReady: (api: SnackbarApi) => void;
}) {
    const snackbar = useSnackbar();
    useEffect(() => {
        onReady(snackbar);
    }, [snackbar, onReady]);
    return null;
}

describe("SnackbarProvider overflow", () => {
    it("fires onDismiss when a snackbar is dropped by the visible cap", async () => {
        const onDismissOldest = vi.fn();
        let api: SnackbarApi | undefined;

        render(
            <SnackbarProvider language={Language.EN}>
                <SnackbarApiProbe
                    onReady={(snackbarApi) => {
                        api = snackbarApi;
                    }}
                />
            </SnackbarProvider>,
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
