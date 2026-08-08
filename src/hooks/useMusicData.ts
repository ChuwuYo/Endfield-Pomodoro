import { useCallback, useEffect, useRef, useState } from "react";
import { musicSourceKey } from "../config/musicConfig";
import { API_FETCH_DELAY_MS } from "../constants";
import { MusicDataError } from "../types";
import { fetchWithTimeout, TimeoutError } from "../utils/fetchWithTimeout";
import { EmptyPlaylistError, getAdapters } from "../utils/musicApiAdapters";

/**
 * 音乐曲目数据结构
 */
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

/**
 * useMusicData Hook 的参数
 */
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

/**
 * 获取音乐数据的 Hook
 *
 * 功能：
 * - 从音乐 API 获取歌单数据
 * - 支持多个 API 适配器的故障转移
 * - 自动超时控制
 * - 请求取消（组件卸载或参数变化时）
 *
 * @param server - 音乐平台（netease/tencent/kugou/baidu/kuwo）
 * @param type - 操作类型（通常为 'playlist'）
 * @param id - 资源 ID（歌单 ID 或搜索关键词）
 */
export const useMusicData = ({ server, type, id }: UseMusicDataProps) => {
    const [audioList, setAudioList] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<MusicDataError | null>(null);
    const [adapterStartIndex, setAdapterStartIndex] = useState(0);
    const [activeAdapterIndex, setActiveAdapterIndex] = useState<number | null>(
        null,
    );
    const abortControllerRef = useRef<AbortController | null>(null);

    const retryWithNextAdapter = useCallback(() => {
        const adapters = getAdapters();
        if (adapters.length === 0) return;
        setAdapterStartIndex((prev) => (prev + 1) % adapters.length);
    }, []);

    // 数据源是否有效；无效时对外暴露 loading=false（见 return）
    const hasSource = Boolean(server && type && id);

    // 数据源变化时在渲染期间重置适配器起始索引
    // （React 官方 "adjusting state when props change" 模式，替代 effect 中的同步 setState）
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
            // 只有在没有任何数据源发生网络/超时/HTTP 失败时，才敢断言「歌单无效」。
            // 混合失败（一源故障、另一源称歌单为空）会保守地归为服务问题：
            // 误报服务问题只会让用户重试，而误报歌单无效会让用户去改一个本来正确的 ID。
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
                    // 如果是外部中止（组件卸载），则直接返回
                    if (controller.signal.aborted) {
                        return;
                    }
                    // 上游以 200 表示歌单无效/为空：不是服务故障，继续问下一个源
                    if (err instanceof EmptyPlaylistError) {
                        continue;
                    }
                    sawServiceFailure = true;
                    // 超时或内部中止：尝试下一个适配器
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
    }, [server, type, id, adapterStartIndex]);

    // 尝试获取单曲的备用 URL
    const fetchTrackUrl = useCallback(
        async (
            trackId: string,
            signal?: AbortSignal,
        ): Promise<string | null> => {
            const adapters = getAdapters();
            // 尝试除当前使用的适配器以外的其他适配器
            const otherAdapters = adapters.filter(
                (_, index) => index !== activeAdapterIndex,
            );
            // 如果没有其他适配器，或者当前还没有成功连接的适配器，则尝试所有适配器
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
