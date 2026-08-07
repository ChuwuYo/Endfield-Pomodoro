import type { MusicTrack } from "../hooks/useMusicData";

/**
 * 音乐 API 适配器接口
 * 用于统一不同音乐 API 的调用方式和数据格式
 */
export interface MusicAPIAdapter {
    /**
     * 构建请求 URL
     */
    buildUrl(params: { server: string; type: string; id: string }): string;

    /**
     * 构建单曲请求 URL
     */
    buildTrackUrl?(params: { server: string; id: string }): string;

    /**
     * 解析 API 响应为统一格式
     */
    parseResponse(data: unknown): MusicTrack[];

    /**
     * 可选的请求配置
     */
    fetchOptions?: RequestInit;
}

const withQuery = (baseUrl: string, params: Record<string, string>): string => {
    const query = new URLSearchParams(params).toString();
    return `${baseUrl}?${query}`;
};

/**
 * Meting API 适配器（主）
 */
export const metingAdapter: MusicAPIAdapter = {
    buildUrl: ({ server, type, id }) =>
        withQuery("https://api.i-meto.com/meting/api", { server, type, id }),

    buildTrackUrl: ({ server, id }) =>
        withQuery("https://api.i-meto.com/meting/api", {
            server,
            type: "song",
            id,
        }),

    parseResponse: (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Empty playlist");
        }
        return data.map((item: Record<string, string>) => ({
            id: item.id || item.song_id || "", // Extract id
            name: item.name || item.title || "Unknown Track",
            artist: item.artist || item.author || "Unknown Artist",
            url: item.url || "",
            cover: item.pic || item.cover || "",
            lrc: item.lrc || "",
            theme: item.theme,
        }));
    },
};

/**
 * Meting API 适配器（备用）
 */
export const metingFallbackAdapter: MusicAPIAdapter = {
    buildUrl: ({ server, type, id }) =>
        withQuery("https://api.injahow.cn/meting/", { server, type, id }),

    buildTrackUrl: ({ server, id }) =>
        withQuery("https://api.injahow.cn/meting/", {
            server,
            type: "song",
            id,
        }),

    parseResponse: metingAdapter.parseResponse,
};

/**
 * 获取当前启用的适配器列表
 * 按优先级排序，失败时会依次尝试下一个
 *
 * 添加新 API 时，在此数组中添加对应的适配器即可
 */
export const getAdapters = (): MusicAPIAdapter[] => {
    return [metingFallbackAdapter, metingAdapter];
};
