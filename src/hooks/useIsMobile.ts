import { useState, useEffect } from 'react';

/**
 * Hook 用于检测当前是否为移动设备
 * 基于媒体查询 (max-width: 768px) 判断
 * 自动监听窗口大小变化
 */
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState<boolean>(() => 
        (typeof window !== 'undefined' && typeof window.matchMedia === 'function') 
            ? window.matchMedia('(max-width: 768px)').matches 
            : false
    );

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isMobile;
};
