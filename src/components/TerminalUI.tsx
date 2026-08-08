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
    NeonGrid,
    OriginForeground,
    OriginGrid,
    RoyalParticles,
    TacticalForeground,
    TacticalGrid,
} from "./themes";

const BACKGROUND_LAYERS: Record<ThemePreset, React.FC> = {
    [ThemePreset.ORIGIN]: OriginGrid,
    [ThemePreset.ABYSSAL]: AbyssalGrid,
    [ThemePreset.NEON]: NeonGrid,
    [ThemePreset.MATRIX]: MatrixRain,
    [ThemePreset.TACTICAL]: TacticalGrid,
    [ThemePreset.ROYAL]: RoyalParticles,
    [ThemePreset.INDUSTRIAL]: IndustrialGrid,
    [ThemePreset.AZURE]: AzureGrid,
    [ThemePreset.MIKU]: MikuBackgroundLayer,
};

/** 仅部分主题有鼠标交互前景；缺失项渲染 null */
const FOREGROUND_LAYERS: Partial<Record<ThemePreset, React.FC>> = {
    [ThemePreset.ORIGIN]: OriginForeground,
    [ThemePreset.TACTICAL]: TacticalForeground,
    [ThemePreset.ABYSSAL]: AbyssalForeground,
    [ThemePreset.INDUSTRIAL]: IndustrialForeground,
    [ThemePreset.AZURE]: AzureForeground,
};

/**
 * 背景层容器 (Z-0)
 * 根据主题渲染对应的静态背景效果
 */
export const BackgroundLayer: React.FC<{ theme?: ThemePreset }> = ({
    theme = ThemePreset.ORIGIN,
}) => {
    const Background = BACKGROUND_LAYERS[theme] ?? OriginGrid;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <Background />
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
    const Foreground = FOREGROUND_LAYERS[theme];
    return Foreground ? <Foreground /> : null;
};
