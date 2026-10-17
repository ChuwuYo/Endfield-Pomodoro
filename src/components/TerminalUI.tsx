import React from "react";
import { useIsMobile } from "../hooks/useIsMobile";
import { ThemePreset } from "../types";
import {
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
    TacticalForeground,
    TacticalGrid,
} from "./themes";

const BACKGROUND_LAYERS: Record<ThemePreset, React.FC> = {
    [ThemePreset.ORIGIN]: OriginGrid,
    [ThemePreset.ABYSSAL]: AbyssalGrid,
    [ThemePreset.NEON]: NeonGrid,
    [ThemePreset.MATRIX]: MatrixRain,
    [ThemePreset.TACTICAL]: TacticalGrid,
    [ThemePreset.INDUSTRIAL]: IndustrialGrid,
    [ThemePreset.AZURE]: AzureGrid,
    [ThemePreset.MIKU]: MikuBackgroundLayer,
};

const FOREGROUND_LAYERS: Partial<Record<ThemePreset, React.FC>> = {
    [ThemePreset.ORIGIN]: OriginForeground,
    [ThemePreset.TACTICAL]: TacticalForeground,
    [ThemePreset.INDUSTRIAL]: IndustrialForeground,
    [ThemePreset.AZURE]: AzureForeground,
};

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

export const ForegroundLayer: React.FC<{ theme?: ThemePreset }> = ({
    theme = ThemePreset.ORIGIN,
}) => {
    const isMobile = useIsMobile();

    if (isMobile) return null;

    const Foreground = FOREGROUND_LAYERS[theme];
    return Foreground ? <Foreground /> : null;
};
