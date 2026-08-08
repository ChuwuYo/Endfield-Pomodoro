import {
    FALLBACK_API_TIMEOUT_MS,
    MUSIC_API_BASE_URL,
    MUSIC_API_FALLBACK_URL,
    PRIMARY_API_TIMEOUT_MS,
} from "../constants";
import type { MusicTrack } from "../hooks/useMusicData";

/**
 * 上游以 HTTP 200 返回空数组或 `{ error: ... }` 时抛出。
 * 与网络/超时/HTTP 错误区分开，使调用方能分辨「歌单无效」与「服务不可用」。
 */
export class EmptyPlaylistError extends Error {
    constructor(message = "Empty playlist") {
        super(message);
        this.name = "EmptyPlaylistError";
    }
}

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

    /**
     * 该数据源的请求超时（毫秒）。省略时使用 API_TIMEOUT_MS。
     * 各源的响应特征与数据价值不同，超时预算据此分配。
     */
    timeoutMs?: number;
}

const withQuery = (baseUrl: string, params: Record<string, string>): string => {
    const query = new URLSearchParams(params).toString();
    return `${baseUrl}?${query}`;
};

/**
 * 两个上游的歌单响应都不含 id/song_id 字段，歌曲 id 只存在于 url 的查询参数里
 * （形如 `...?server=netease&type=url&id=<songId>`）。单曲级回退依赖该 id。
 */
const trackIdFromUrl = (url: unknown): string => {
    if (typeof url !== "string" || url === "") return "";
    try {
        return new URL(url).searchParams.get("id") ?? "";
    } catch {
        return "";
    }
};

/**
 * Meting API 适配器（主）
 */
export const metingAdapter: MusicAPIAdapter = {
    buildUrl: ({ server, type, id }) =>
        withQuery(MUSIC_API_BASE_URL, { server, type, id }),

    buildTrackUrl: ({ server, id }) =>
        withQuery(MUSIC_API_BASE_URL, {
            server,
            type: "song",
            id,
        }),

    parseResponse: (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            throw new EmptyPlaylistError();
        }
        return data.map((item: Record<string, string>) => ({
            id: item.id || item.song_id || trackIdFromUrl(item.url),
            name: item.name || item.title || "Unknown Track",
            artist: item.artist || item.author || "Unknown Artist",
            url: item.url || "",
            cover: item.pic || item.cover || "",
            lrc: item.lrc || "",
            theme: item.theme,
        }));
    },

    timeoutMs: PRIMARY_API_TIMEOUT_MS,
};

/**
 * Meting API 适配器（备用）
 */
export const metingFallbackAdapter: MusicAPIAdapter = {
    buildUrl: ({ server, type, id }) =>
        withQuery(MUSIC_API_FALLBACK_URL, { server, type, id }),

    buildTrackUrl: ({ server, id }) =>
        withQuery(MUSIC_API_FALLBACK_URL, {
            server,
            type: "song",
            id,
        }),

    parseResponse: metingAdapter.parseResponse,

    timeoutMs: FALLBACK_API_TIMEOUT_MS,
};

/**
 * 获取当前启用的适配器列表
 * 按优先级排序，失败时会依次尝试下一个
 *
 * 顺序遵循 constants.ts 声明的主/备契约：主源 i-meto 数据新鲜度更高，
 * 备源 injahow 响应快但存在服务端长缓存（同一歌单会返回陈旧曲目），
 * 仅在主源超时或失败时兜底。
 *
 * 添加新 API 时，在此数组中添加对应的适配器即可
 */
export const getAdapters = (): MusicAPIAdapter[] => {
    return [metingAdapter, metingFallbackAdapter];
};
