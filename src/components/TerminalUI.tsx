/**
 * TerminalUI - 主题层容器组件
 *
 * 负责根据当前主题渲染对应的背景和前景效果
 * 主题效果组件位于 ./themes/ 目录
 */
import React from "react";
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
    const isMobile = useIsMobile();

    // 移动端不渲染鼠标交互层
    if (isMobile) return null;

    // 所有鼠标跟随主题均在组件内部以 ref 直写 transform 跟踪光标，
    // 不再经由 React state 逐帧重渲染
    switch (theme) {
        case ThemePreset.ORIGIN:
            return <OriginForeground />;
        case ThemePreset.TACTICAL:
            return <TacticalForeground />;
        case ThemePreset.ABYSSAL:
            return <AbyssalForeground />;
        case ThemePreset.INDUSTRIAL:
            return <IndustrialForeground />;
        case ThemePreset.AZURE:
            return <AzureForeground />;
        case ThemePreset.MIKU:
            return <MikuForegroundLayer />;
        default:
            return null;
    }
};
