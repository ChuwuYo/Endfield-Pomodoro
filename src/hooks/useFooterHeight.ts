import { useEffect, useRef, useState } from "react";
import { scalePx } from "../utils/uiScale";

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
        observer.observe(footer, { box: "border-box" });
        return () => observer.disconnect();
    }, []);

    return { footerRef, footerHeight };
};

export const getThemeExtraSpacing = (isMikuTheme: boolean): number => {
    return scalePx(isMikuTheme ? 120 : 60);
};
