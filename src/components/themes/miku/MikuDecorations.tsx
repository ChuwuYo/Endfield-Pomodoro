import React from "react";
import mikuCharImg from "../../../assets/images/MIKU1.webp";
import mikuLogoImg from "../../../assets/images/MIKULogo.svg";
import { ThemePreset } from "../../../types";

// Miku 角色图片装饰组件
const MikuCharacter: React.FC<{ footerHeight: number }> = ({
    footerHeight,
}) => {
    return (
        <div
            className="fixed left-1/2 -translate-x-1/2 z-[5] pointer-events-none"
            style={{ bottom: footerHeight }}
        >
            <img
                src={mikuCharImg}
                alt="Miku"
                className="w-24 h-24 md:w-36 md:h-36 object-contain opacity-90"
                draggable={false}
            />
        </div>
    );
};

// Miku Logo 装饰组件
const MikuLogo: React.FC<{ footerHeight: number }> = ({ footerHeight }) => {
    return (
        <div
            className="fixed right-4 md:right-8 z-[5] pointer-events-none"
            style={{ bottom: footerHeight }}
        >
            <img
                src={mikuLogoImg}
                alt="Miku Logo"
                className="w-10 h-10 md:w-16 md:h-16 opacity-80"
                draggable={false}
            />
        </div>
    );
};

// Miku 主题装饰层容器 - 自动处理主题检查
export const MikuDecorations: React.FC<{
    theme: ThemePreset;
    footerHeight: number;
}> = ({ theme, footerHeight }) => {
    // 只在 Miku 主题时渲染
    if (theme !== ThemePreset.MIKU) {
        return null;
    }

    return (
        <>
            <MikuCharacter footerHeight={footerHeight} />
            <MikuLogo footerHeight={footerHeight} />
        </>
    );
};
