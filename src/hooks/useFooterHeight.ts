import { useRef, useEffect, useState } from 'react';

/**
 * Hook 用于获取 footer 元素的高度
 * 返回 ref 和当前高度，自动监听窗口 resize 事件
 */
export const useFooterHeight = () => {
    const footerRef = useRef<HTMLElement>(null);
    const [footerHeight, setFooterHeight] = useState(0);

    useEffect(() => {
        const updateFooterHeight = () => {
            if (footerRef.current) {
                setFooterHeight(footerRef.current.offsetHeight);
            }
        };
        
        updateFooterHeight();
        window.addEventListener('resize', updateFooterHeight);
        
        return () => window.removeEventListener('resize', updateFooterHeight);
    }, []);

    return { footerRef, footerHeight };
};

/**
 * Hook 用于获取移动端底部间距
 * 根据主题和页面类型动态调整间距
 * 
 * @param isMikuTheme 是否为 Miku 主题
 * @param isSettingsPage 是否为设置页面
 * @returns Tailwind CSS 类名
 */
export const useMikuMobileSpacing = (isMikuTheme: boolean, isSettingsPage: boolean = false) => {
    if (isMikuTheme) {
        // Miku 主题需要为装饰元素预留空间
        return isSettingsPage ? 'h-46' : 'h-32'; // 设置页需要更多空间 (160px vs 128px)
    }
    return 'h-24'; // 普通主题基础间距 (96px)
};
