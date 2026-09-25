import {
    FALLBACK_API_TIMEOUT_MS,
    MUSIC_API_URLS,
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
 * 这些上游的歌单响应都不含 id/song_id 字段，歌曲 id 只存在于 url 的查询参数里
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

const parseMetingResponse = (data: unknown): MusicTrack[] => {
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
};

const createMetingAdapter = (
    baseUrl: string,
    timeoutMs: number,
): MusicAPIAdapter => ({
    buildUrl: ({ server, type, id }) =>
        withQuery(baseUrl, { server, type, id }),

    buildTrackUrl: ({ server, id }) =>
        withQuery(baseUrl, {
            server,
            type: "song",
            id,
        }),

    parseResponse: parseMetingResponse,
    timeoutMs,
});

export const metingAdapter = createMetingAdapter(
    MUSIC_API_URLS[0],
    PRIMARY_API_TIMEOUT_MS,
);
export const metingFallbackAdapter = createMetingAdapter(
    MUSIC_API_URLS[1],
    FALLBACK_API_TIMEOUT_MS,
);
export const metingBackupAdapters = MUSIC_API_URLS.slice(2).map((url) =>
    createMetingAdapter(url, FALLBACK_API_TIMEOUT_MS),
);

export const getAdapters = (): MusicAPIAdapter[] => {
    return [metingAdapter, metingFallbackAdapter, ...metingBackupAdapters];
};
