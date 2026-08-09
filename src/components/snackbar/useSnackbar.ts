import { createContext, useContext } from "react";
import type { SnackbarApi } from "./snackbarTypes";

export const SnackbarContext = createContext<SnackbarApi | null>(null);

export function useSnackbar(): SnackbarApi {
    const ctx = useContext(SnackbarContext);
    if (!ctx) {
        throw new Error("useSnackbar must be used within SnackbarProvider");
    }
    return ctx;
}
