import type { MusicTrack } from '../hooks/useMusicData';

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
     * 解析 API 响应为统一格式
     */
    parseResponse(data: unknown): MusicTrack[];
    
    /**
     * 可选的请求配置
     */
    fetchOptions?: RequestInit;
}

/**
 * Meting API 适配器（主）
 */
export const metingAdapter: MusicAPIAdapter = {
    buildUrl: ({ server, type, id }) => {
        return `https://api.i-meto.com/meting/api?server=${server}&type=${type}&id=${id}`;
    },
    
    parseResponse: (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Empty playlist');
        }
        return data.map((item: Record<string, string>) => ({
            name: item.name || item.title || 'Unknown Track',
            artist: item.artist || item.author || 'Unknown Artist',
            url: item.url || '',
            cover: item.pic || item.cover || '',
            lrc: item.lrc || '',
            theme: item.theme,
        }));
    }
};

/**
 * Meting API 适配器（备用）
 */
export const metingFallbackAdapter: MusicAPIAdapter = {
    buildUrl: ({ server, type, id }) => {
        return `https://api.injahow.cn/meting/?server=${server}&type=${type}&id=${id}`;
    },
    
    parseResponse: metingAdapter.parseResponse
};

/**
 * 获取当前启用的适配器列表
 * 按优先级排序，失败时会依次尝试下一个
 * 
 * 添加新 API 时，在此数组中添加对应的适配器即可
 */
export const getAdapters = (): MusicAPIAdapter[] => {
    return [
        metingAdapter,
        metingFallbackAdapter
    ];
};
