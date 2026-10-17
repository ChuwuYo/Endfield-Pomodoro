import { useCallback, useEffect, useRef, useState } from "react";
import { musicSourceKey } from "../config/musicConfig";
import { API_FETCH_DELAY_MS } from "../constants";
import { MusicDataError } from "../types";
import { fetchWithTimeout, TimeoutError } from "../utils/fetchWithTimeout";
import { EmptyPlaylistError, getAdapters } from "../utils/musicApiAdapters";
import { useRetryOnReconnect } from "./useRetryOnReconnect";

export interface MusicTrack {
    /** 歌曲唯一标识符。如果不可用，可能为空字符串。 */
    id: string;
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
    theme?: string;
}

interface UseMusicDataProps {
    server: string;
    type: string;
    id: string;
}

const withoutSignal = (fetchOptions?: RequestInit): RequestInit => {
    const safeFetchOptions = { ...(fetchOptions || {}) };
    if ("signal" in safeFetchOptions) {
        delete safeFetchOptions.signal;
    }
    return safeFetchOptions;
};

export const useMusicData = ({ server, type, id }: UseMusicDataProps) => {
    const [audioList, setAudioList] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<MusicDataError | null>(null);
    const [adapterStartIndex, setAdapterStartIndex] = useState(0);
    const [activeAdapterIndex, setActiveAdapterIndex] = useState<number | null>(
        null,
    );
    const [reloadToken, setReloadToken] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    const retryWithNextAdapter = useCallback(() => {
        const adapters = getAdapters();
        if (adapters.length === 0) return;
        setAdapterStartIndex((prev) => (prev + 1) % adapters.length);
    }, []);

    const hasSource = Boolean(server && type && id);

    const sourceKey = musicSourceKey({ server, type, id });
    const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);
    if (prevSourceKey !== sourceKey) {
        setPrevSourceKey(sourceKey);
        setAdapterStartIndex(0);
    }

    useEffect(() => {
        if (!server || !type || !id) {
            return;
        }

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setActiveAdapterIndex(null);

            const adapters = getAdapters();
            // 任一源出现网络/超时/HTTP 失败时按服务故障处理，不判定歌单无效
            let sawServiceFailure = false;

            for (let i = 0; i < adapters.length; i += 1) {
                const adapterIndex = (adapterStartIndex + i) % adapters.length;
                const adapter = adapters[adapterIndex];
                if (controller.signal.aborted) return;

                try {
                    const url = adapter.buildUrl({ server, type, id });
                    const response = await fetchWithTimeout(
                        url,
                        withoutSignal(adapter.fetchOptions),
                        {
                            externalSignal: controller.signal,
                            timeoutMs: adapter.timeoutMs,
                        },
                    );

                    if (!response.ok)
                        throw new Error(`HTTP ${response.status}`);

                    const data = await response.json();
                    if (controller.signal.aborted) return;

                    const tracks = adapter.parseResponse(data);

                    setAudioList(tracks);
                    setActiveAdapterIndex(adapterIndex);
                    setLoading(false);
                    return;
                } catch (err) {
                    if (controller.signal.aborted) {
                        return;
                    }
                    // 上游以 200 表示歌单无效/为空：不是服务故障，继续问下一个源
                    if (err instanceof EmptyPlaylistError) {
                        continue;
                    }
                    sawServiceFailure = true;
                    if (
                        err instanceof TimeoutError ||
                        (err instanceof DOMException &&
                            err.name === "AbortError")
                    ) {
                        continue;
                    }
                    console.warn(`API adapter failed:`, err);
                }
            }

            setError(
                sawServiceFailure
                    ? MusicDataError.SERVICE_UNAVAILABLE
                    : MusicDataError.PLAYLIST_UNAVAILABLE,
            );
            setLoading(false);
        };

        const timeoutId = setTimeout(fetchData, API_FETCH_DELAY_MS);
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [server, type, id, adapterStartIndex, reloadToken]);

    const reload = useCallback(() => {
        setReloadToken((prev) => prev + 1);
    }, []);

    useRetryOnReconnect(
        hasSource && error === MusicDataError.SERVICE_UNAVAILABLE,
        reload,
    );

    const fetchTrackUrl = useCallback(
        async (
            trackId: string,
            signal?: AbortSignal,
        ): Promise<string | null> => {
            const adapters = getAdapters();
            const otherAdapters = adapters.filter(
                (_, index) => index !== activeAdapterIndex,
            );
            const targetAdapters =
                otherAdapters.length > 0 ? otherAdapters : adapters;

            for (const adapter of targetAdapters) {
                if (!adapter.buildTrackUrl) continue;
                if (signal?.aborted) return null;

                try {
                    const url = adapter.buildTrackUrl({ server, id: trackId });
                    const response = await fetchWithTimeout(
                        url,
                        withoutSignal(adapter.fetchOptions),
                        {
                            externalSignal: signal,
                            timeoutMs: adapter.timeoutMs,
                        },
                    );

                    if (!response.ok) continue;

                    const data = await response.json();
                    const tracks = adapter.parseResponse(data);
                    if (tracks.length > 0 && tracks[0].url) {
                        return tracks[0].url;
                    }
                } catch (err) {
                    if (signal?.aborted) return null;
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    ) {
                        continue;
                    }
                    if (err instanceof TimeoutError) {
                        continue;
                    }
                    console.warn("Track fallback fetch failed:", err);
                }
            }
            return null;
        },
        [server, activeAdapterIndex],
    );

    return {
        audioList,
        loading: hasSource ? loading : false,
        error,
        retryWithNextAdapter,
        activeAdapterIndex,
        fetchTrackUrl,
    };
};
