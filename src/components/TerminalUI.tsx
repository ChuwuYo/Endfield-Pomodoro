/**
 * TerminalUI - 主题层容器组件
 *
 * 负责根据当前主题渲染对应的背景和前景效果
 * 主题效果组件位于 ./themes/ 目录
 */
import React, { useEffect, useState } from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { ThemePreset } from "../types";
// 主题效果
import {
    AbyssalForeground,
    AbyssalGrid,
    AzureForeground,
    AzureGrid,
    IndustrialForeground,
    IndustrialGrid,
    MatrixRain,
    MikuBackgroundLayer,
    MikuForegroundLayer,
    NeonGrid,
    OriginForeground,
    OriginGrid,
    RoyalParticles,
    TacticalForeground,
    TacticalGrid,
} from "./themes";

/**
 * 背景层容器 (Z-0)
 * 根据主题渲染对应的静态背景效果
 */
export const BackgroundLayer: React.FC<{ theme?: ThemePreset }> = ({
    theme = ThemePreset.ORIGIN,
}) => {
    const renderContent = () => {
        switch (theme) {
            case ThemePreset.ABYSSAL:
                return <AbyssalGrid />;
            case ThemePreset.NEON:
                return <NeonGrid />;
            case ThemePreset.MATRIX:
                return <MatrixRain />;
            case ThemePreset.TACTICAL:
                return <TacticalGrid />;
            case ThemePreset.ROYAL:
                return <RoyalParticles />;
            case ThemePreset.INDUSTRIAL:
                return <IndustrialGrid />;
            case ThemePreset.AZURE:
                return <AzureGrid />;
            case ThemePreset.MIKU:
                return <MikuBackgroundLayer />;
            default:
                return <OriginGrid />;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {renderContent()}
        </div>
    );
};

/**
 * 前景层容器 (Z-50)
 * 根据主题渲染对应的鼠标交互效果
 */
export const ForegroundLayer: React.FC<{ theme?: ThemePreset }> = ({
    theme = ThemePreset.ORIGIN,
}) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const isMobile = useIsMobile();

    // 仅 INDUSTRIAL 仍通过 React state 消费鼠标坐标；
    // 其余鼠标主题均已迁移到 ref 直写 transform，不再触发逐帧重渲染
    const needsMousePos = !isMobile && theme === ThemePreset.INDUSTRIAL;

    useEffect(() => {
        if (!needsMousePos) return;

        // 同步 setState：浏览器按帧节奏合并派发 mousemove（每帧至多一次），
        // 经 rAF 转发可能多等一帧，表现为光标跟随延迟
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [needsMousePos]);

    // 移动端不渲染鼠标交互层
    if (isMobile) return null;

    switch (theme) {
        case ThemePreset.ORIGIN:
            return <OriginForeground />;
        case ThemePreset.TACTICAL:
            return <TacticalForeground />;
        case ThemePreset.ABYSSAL:
            return <AbyssalForeground />;
        case ThemePreset.INDUSTRIAL:
            return <IndustrialForeground mousePos={mousePos} />;
        case ThemePreset.AZURE:
            return <AzureForeground />;
        case ThemePreset.MIKU:
            return <MikuForegroundLayer />;
        default:
            return null;
    }
};
