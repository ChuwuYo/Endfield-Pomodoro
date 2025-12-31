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
 * Hook 用于获取 Miku 主题所需的移动端底部间距
 * 返回间距类名，根据是否是 Miku 主题动态调整
 */
export const useMikuMobileSpacing = (isMikuTheme: boolean) => {
    return isMikuTheme ? 'h-40' : 'h-24';
};
