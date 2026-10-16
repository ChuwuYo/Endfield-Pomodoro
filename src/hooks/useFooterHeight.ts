import { useEffect, useRef, useState } from "react";
import { scalePx } from "../utils/uiScale";

/**
 * Hook 用于获取 footer 元素的高度
 * 返回 ref 和当前高度，ResizeObserver 跟踪 footer 尺寸（字体加载、语言、缩放），
 * 高度同步写入根元素 --footer-h
 */
export const useFooterHeight = () => {
    const footerRef = useRef<HTMLElement>(null);
    const [footerHeight, setFooterHeight] = useState(0);

    useEffect(() => {
        const footer = footerRef.current;
        if (!footer) return;

        let lastHeight = -1;
        const updateFooterHeight = () => {
            const height = footer.offsetHeight;
            if (height === lastHeight) return;
            lastHeight = height;
            setFooterHeight(height);
            document.documentElement.style.setProperty(
                "--footer-h",
                `${height}px`,
            );
        };

        updateFooterHeight();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateFooterHeight);
            return () =>
                window.removeEventListener("resize", updateFooterHeight);
        }

        const observer = new ResizeObserver(updateFooterHeight);
        observer.observe(footer);
        return () => observer.disconnect();
    }, []);

    return { footerRef, footerHeight };
};

/**
 * 计算主题装饰元素需要的额外间距（设计稿 px，经 --ui-scale 换算）
 * @param isMikuTheme 是否为 Miku 主题
 * @returns 额外间距像素值
 */
export const getThemeExtraSpacing = (isMikuTheme: boolean): number => {
    // Miku：120；其他：60（均随 --ui-scale）
    return scalePx(isMikuTheme ? 120 : 60);
};
