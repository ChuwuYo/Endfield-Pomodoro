import { useState, useEffect } from 'react';
import { METING_API_BASE_URL } from '../constants';

export interface MetingAudio {
    name: string;
    artist: string;
    url: string;
    cover: string;
    lrc: string;
    theme?: string;
    pic?: string;
    title?: string;
    author?: string;
}

interface UseMetingDataProps {
    server: string;
    type: string;
    id: string;
}

export const useMetingData = ({ server, type, id }: UseMetingDataProps) => {
    const [audioList, setAudioList] = useState<MetingAudio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetingData = async () => {
            setLoading(true);
            setError(null);

            try {
                // 使用 Meting API
                const apiUrl = `${METING_API_BASE_URL}?server=${server}&type=${type}&id=${id}`;

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch music data');
                }

                const data = await response.json();

                const formattedAudioList = data.map((item: Record<string, string>) => ({
                    name: item.name || item.title || 'Unknown Track',
                    artist: item.artist || item.author || 'Unknown Artist',
                    url: item.url || '',
                    cover: item.pic || item.cover || '',
                    lrc: item.lrc || '',
                    theme: item.theme,
                }));

                setAudioList(formattedAudioList);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                console.error('Meting API Error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (server && type && id) {
            // 短暂延迟以允许 UI 先渲染，减少初始加载卡顿
            const timeoutId = setTimeout(() => {
                fetchMetingData();
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [server, type, id]);

    return { audioList, loading, error };
};
