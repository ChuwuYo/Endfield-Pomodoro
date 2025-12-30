import { useState, useEffect, useRef } from 'react';
import { API_FETCH_DELAY_MS, API_TIMEOUT_MS } from '../constants';
import { getAdapters } from '../utils/musicApiAdapters';

/**
 * 音乐曲目数据结构
 */
export interface MusicTrack {
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
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!server || !type || !id) {
            setLoading(false);
            return;
        }

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            const adapters = getAdapters();

            for (const adapter of adapters) {
                if (controller.signal.aborted) return;

                let timeoutId: ReturnType<typeof setTimeout> | null = null;
                try {
                    const url = adapter.buildUrl({ server, type, id });
                    
                    // 使用 Promise.race 来处理超时，并在完成后清理 setTimeout
                    const response = await Promise.race([
                        fetch(url, {
                            signal: controller.signal,
                            ...adapter.fetchOptions
                        }),
                        new Promise<never>((_, reject) => {
                            timeoutId = setTimeout(() => reject(new Error('API request timed out')), API_TIMEOUT_MS);
                        })
                    ]);
                    
                    // 请求成功，清理超时计时器
                    if (timeoutId) clearTimeout(timeoutId);

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const data = await response.json();
                    const tracks = adapter.parseResponse(data);

                    setAudioList(tracks);
                    setLoading(false);
                    return;
                } catch (err) {
                    // 清理超时计时器
                    if (timeoutId) clearTimeout(timeoutId);
                    
                    // 如果是外部中止（组件卸载），则直接返回
                    if (controller.signal.aborted) {
                        return;
                    }
                    // 其他错误（如超时、网络问题），记录并尝试下一个适配器
                    console.warn(`API adapter failed:`, err);
                }
            }

            setError('All APIs failed');
            setLoading(false);
        };

        const timeoutId = setTimeout(fetchData, API_FETCH_DELAY_MS);
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [server, type, id]);

    return { audioList, loading, error };
};
