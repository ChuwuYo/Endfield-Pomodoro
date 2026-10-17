import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MANUAL_UPDATE_RESULT_RESET_MS } from "../constants";
import {
    checkForPwaUpdate,
    getPwaRegistration,
    type ManualUpdateCheckResult,
    subscribePwaRegistration,
} from "../utils/pwaRegistration";

/** 按钮状态：空闲 / 检查中 / 上次检查结果 */
export type ManualUpdateCheckStatus =
    | "idle"
    | "checking"
    | ManualUpdateCheckResult;

const getServerRegistration = () => null;

/**
 * 设置页「检查更新」：available 表示已有 SW 注册可供检查；
 * check() 触发一次检查，结果停留片刻后回到 idle。
 */
export const useManualUpdateCheck = (
    onResult?: (result: ManualUpdateCheckResult) => void,
) => {
    const registration = useSyncExternalStore(
        subscribePwaRegistration,
        getPwaRegistration,
        getServerRegistration,
    );
    const [status, setStatus] = useState<ManualUpdateCheckStatus>("idle");
    const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        };
    }, []);

    const check = async () => {
        if (!registration || status === "checking") return;
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        setStatus("checking");
        const result = await checkForPwaUpdate(registration);
        if (!mountedRef.current) return;
        setStatus(result);
        onResult?.(result);
        resetTimerRef.current = setTimeout(
            () => setStatus("idle"),
            MANUAL_UPDATE_RESULT_RESET_MS,
        );
    };

    return { available: registration !== null, status, check };
};
