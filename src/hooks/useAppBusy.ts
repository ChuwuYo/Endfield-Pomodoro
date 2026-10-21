import { useEffect } from "react";
import { setAppBusy } from "../utils/appActivity";

export const useAppBusy = (key: string, busy: boolean): void => {
    useEffect(() => {
        setAppBusy(key, busy);
        return () => setAppBusy(key, false);
    }, [key, busy]);
};
