import { ThemePreset } from '../types';

/**
 * 主题颜色配置
 * 定义每个主题预设的 CSS 变量值
 */
export const THEMES: Record<ThemePreset, Record<string, string>> = {
    [ThemePreset.ORIGIN]: {
        '--color-base': '#111113',
        '--color-surface': '#1c1c1f',
        '--color-highlight': '#2e2e33',
        '--color-primary': '#ea580c',
        '--color-secondary': '#fbbf24',
        '--color-accent': '#06b6d4',
        '--color-text': '#fcf8deff',
        '--color-dim': '#71717a',
        '--color-success': '#22c55e',
        '--color-error': '#ef4444'
    },
    [ThemePreset.AZURE]: {
        '--color-base': '#0f172a',
        '--color-surface': '#1e293b',
        '--color-highlight': '#334155',
        '--color-primary': '#38bdf8',
        '--color-secondary': '#94a3b8',
        '--color-accent': '#f472b6',
        '--color-text': '#f1f5f9',
        '--color-dim': '#64748b',
        '--color-success': '#22c55e',
        '--color-error': '#ef4444'
    },
    [ThemePreset.NEON]: {
        '--color-base': '#180024',
        '--color-surface': '#2e0242',
        '--color-highlight': '#ad39ff',
        '--color-primary': '#ff00ff',
        '--color-secondary': '#00ffff',
        '--color-accent': '#ffff00',
        '--color-text': '#f5d0fe',
        '--color-dim': '#a21caf',
        '--color-success': '#00ff00',
        '--color-error': '#ff0000'
    },
    [ThemePreset.MATRIX]: {
        '--color-base': '#000000',
        '--color-surface': '#031403',
        '--color-highlight': '#082908',
        '--color-primary': '#d0ff4b',
        '--color-secondary': '#3cf551',
        '--color-accent': '#ccffcc',
        '--color-text': '#e0fce0',
        '--color-dim': '#77fbac',
        '--color-success': '#00ff00',
        '--color-error': '#ff0000'
    },
    [ThemePreset.TACTICAL]: {
        '--color-base': '#1c1917',
        '--color-surface': '#292524',
        '--color-highlight': '#44403c',
        '--color-primary': '#d97706',
        '--color-secondary': '#a8a29e',
        '--color-accent': '#78716c',
        '--color-text': '#f6f6df',
        '--color-dim': '#57534e',
        '--color-success': '#16a34a',
        '--color-error': '#dc2626'
    },
    [ThemePreset.ROYAL]: {
        '--color-base': '#100c19',
        '--color-surface': '#1d162e',
        '--color-highlight': '#31254a',
        '--color-primary': '#c084fc',
        '--color-secondary': '#fbbf24',
        '--color-accent': '#e879f9',
        '--color-text': '#f3e8ff',
        '--color-dim': '#6b21a8',
        '--color-success': '#a1f65c',
        '--color-error': '#dc2626'
    },
    [ThemePreset.INDUSTRIAL]: {
        '--color-base': '#e5e5e5',
        '--color-surface': '#d4d4d4',
        '--color-highlight': '#a3a3a3',
        '--color-primary': '#f97316',
        '--color-secondary': '#f6ff00',
        '--color-accent': '#ffd1f6',
        '--color-text': '#141414',
        '--color-dim': '#7a7a7a',
        '--color-success': '#16a34a',
        '--color-error': '#dc2626'
    },
    [ThemePreset.LABORATORY]: {
        '--color-base': '#f8fafc',
        '--color-surface': '#edeff0',
        '--color-highlight': '#cbced1',
        '--color-primary': '#0ea5e9',
        '--color-secondary': '#64748b',
        '--color-accent': '#5fffdcff',
        '--color-text': '#0f172a',
        '--color-dim': '#94a3b8',
        '--color-success': '#059669',
        '--color-error': '#dc2626'
    },
    [ThemePreset.MIKU]: {
        '--color-base': '#fefef8',
        '--color-surface': '#fdfef8',
        '--color-highlight': '#fdd1ff',
        '--color-primary': '#39C5BB',
        '--color-secondary': '#f6b8da',
        '--color-accent': '#E91E63',
        '--color-text': '#263238',
        '--color-dim': '#78909C',
        '--color-success': '#00E676',
        '--color-error': '#FF5252'
    }
};
