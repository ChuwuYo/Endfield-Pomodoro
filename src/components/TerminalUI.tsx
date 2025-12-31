/**
 * TerminalUI - 主题层容器组件
 * 
 * 负责根据当前主题渲染对应的背景和前景效果
 * UI 基础组件已拆分到 ./ui/ 目录
 * 主题效果组件已拆分到 ./themes/ 目录
 */
import React, { useEffect, useState } from 'react';
import { ThemePreset } from '../types';

// UI 基础组件 - 重新导出以保持向后兼容
export { Panel } from './ui/Panel';
export { Button } from './ui/Button';
export { Input, Select } from './ui/Input';

// 主题背景效果
import {
    OriginGrid,
    AzureGrid,
    NeonGrid,
    MatrixRain,
    TacticalGrid,
    RoyalParticles,
    IndustrialGrid,
    LaboratoryGrid
} from './themes/BackgroundEffects';

// 主题前景效果
import {
    OriginForeground,
    TacticalForeground,
    AzureForeground,
    IndustrialForeground,
    LaboratoryForeground
} from './themes/ForegroundEffects';

// Miku 主题效果
import { MikuBackgroundLayer, MikuForegroundLayer } from './MikuDecorations';

/**
 * 背景层容器 (Z-0)
 * 根据主题渲染对应的静态背景效果
 */
export const BackgroundLayer: React.FC<{ theme?: ThemePreset }> = ({ theme = ThemePreset.ORIGIN }) => {
    const renderContent = () => {
        switch (theme) {
            case ThemePreset.AZURE: return <AzureGrid />;
            case ThemePreset.NEON: return <NeonGrid />;
            case ThemePreset.MATRIX: return <MatrixRain />;
            case ThemePreset.TACTICAL: return <TacticalGrid />;
            case ThemePreset.ROYAL: return <RoyalParticles />;
            case ThemePreset.INDUSTRIAL: return <IndustrialGrid />;
            case ThemePreset.LABORATORY: return <LaboratoryGrid />;
            case ThemePreset.MIKU: return <MikuBackgroundLayer />;
            default: return <OriginGrid />;
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
export const ForegroundLayer: React.FC<{ theme?: ThemePreset }> = ({ theme = ThemePreset.ORIGIN }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

    useEffect(() => {
        if (isMobile) return;

        let animationFrameId: number;
        const handleMouseMove = (e: MouseEvent) => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                setMousePos({ x: e.clientX, y: e.clientY });
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isMobile]);

    // 移动端不渲染鼠标交互层
    if (isMobile) return null;

    switch (theme) {
        case ThemePreset.ORIGIN:
            return <OriginForeground mousePos={mousePos} />;
        case ThemePreset.TACTICAL:
            return <TacticalForeground mousePos={mousePos} />;
        case ThemePreset.AZURE:
            return <AzureForeground />;
        case ThemePreset.INDUSTRIAL:
            return <IndustrialForeground mousePos={mousePos} />;
        case ThemePreset.LABORATORY:
            return <LaboratoryForeground mousePos={mousePos} />;
        case ThemePreset.MIKU:
            return <MikuForegroundLayer mousePos={mousePos} />;
        default:
            return null;
    }
};
