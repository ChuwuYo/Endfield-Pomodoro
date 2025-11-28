
import React, { useState, useEffect } from 'react';
import Pomodoro from './components/Pomodoro';
import TaskManager from './components/TaskManager';
import AudioPlayer from './components/AudioPlayer';
import type { Settings } from './types';
import { Language, ThemePreset } from './types';
import { Panel, Input, BackgroundLayer, ForegroundLayer, Button } from './components/TerminalUI';
import { CustomSelect } from './components/CustomSelect';
import { Checkbox } from './components/Checkbox';
import { useTranslation } from './utils/i18n';
import pkg from '../package.json';

const DEFAULT_SETTINGS: Settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    soundVolume: 0.5,
    language: Language.CN,
    theme: ThemePreset.ORIGIN
};

const View = {
    DASHBOARD: 'DASHBOARD',
    SETTINGS: 'SETTINGS'
} as const;
type View = typeof View[keyof typeof View];

// Extended Theme Definitions
const THEMES = {
    [ThemePreset.ORIGIN]: {
        '--color-base': '#111113',
        '--color-surface': '#1c1c1f',
        '--color-highlight': '#2e2e33',
        '--color-primary': '#ea580c', // Orange
        '--color-secondary': '#fbbf24', // Amber
        '--color-accent': '#06b6d4', // Cyan
        '--color-text': '#e4e4e7',
        '--color-dim': '#71717a'
    },
    [ThemePreset.AZURE]: {
        '--color-base': '#0f172a',
        '--color-surface': '#1e293b',
        '--color-highlight': '#334155',
        '--color-primary': '#38bdf8', // Light Blue
        '--color-secondary': '#94a3b8', // Slate
        '--color-accent': '#f472b6', // Pink
        '--color-text': '#f1f5f9',
        '--color-dim': '#64748b'
    },
    [ThemePreset.NEON]: {
        '--color-base': '#180024',
        '--color-surface': '#2e0242',
        '--color-highlight': '#4c0f66',
        '--color-primary': '#ff00ff', // Magenta
        '--color-secondary': '#00ffff', // Cyan
        '--color-accent': '#ffff00', // Yellow
        '--color-text': '#f5d0fe',
        '--color-dim': '#a21caf'
    },
    [ThemePreset.MATRIX]: {
        '--color-base': '#000000',
        '--color-surface': '#031403',
        '--color-highlight': '#082908',
        '--color-primary': '#00ff41', // Matrix Green
        '--color-secondary': '#008f11',
        '--color-accent': '#ccffcc',
        '--color-text': '#e0fce0',
        '--color-dim': '#14532d'
    },
    [ThemePreset.TACTICAL]: {
        '--color-base': '#1c1917', // Warm grey dark
        '--color-surface': '#292524',
        '--color-highlight': '#44403c',
        '--color-primary': '#d97706', // Amber 600
        '--color-secondary': '#a8a29e', // Stone
        '--color-accent': '#78716c',
        '--color-text': '#f5f5f4',
        '--color-dim': '#57534e'
    },
    [ThemePreset.ROYAL]: {
        '--color-base': '#100c19',
        '--color-surface': '#1d162e',
        '--color-highlight': '#31254a',
        '--color-primary': '#c084fc', // Purple
        '--color-secondary': '#fbbf24', // Gold
        '--color-accent': '#e879f9',
        '--color-text': '#f3e8ff',
        '--color-dim': '#6b21a8'
    },
    [ThemePreset.INDUSTRIAL]: {
        '--color-base': '#e5e5e5',
        '--color-surface': '#d4d4d4',
        '--color-highlight': '#a3a3a3',
        '--color-primary': '#f97316', // Safety Orange
        '--color-secondary': '#eab308', // Caution Yellow
        '--color-accent': '#262626', // Dark Grey
        '--color-text': '#171717',
        '--color-dim': '#737373'
    },
    [ThemePreset.LABORATORY]: {
        '--color-base': '#f8fafc',
        '--color-surface': '#f1f5f9',
        '--color-highlight': '#e2e8f0',
        '--color-primary': '#0ea5e9', // Sky Blue
        '--color-secondary': '#64748b', // Slate
        '--color-accent': '#ec4899', // Pink
        '--color-text': '#0f172a',
        '--color-dim': '#94a3b8'
    }
};

const App: React.FC = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    // Removed unused sessionCount variable to fix linter warning
    const [, setSessionCount] = useState(0);
    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [now, setNow] = useState(new Date());
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const t = useTranslation(settings.language);

    // Update Document Title
    useEffect(() => {
        document.title = t('APP_TITLE');
    }, [t]);

    // Apply Theme
    useEffect(() => {
        const root = document.documentElement;
        const themeColors = THEMES[settings.theme];
        Object.entries(themeColors).forEach(([key, value]) => {
            root.style.setProperty(key, value as string);
        });
    }, [settings.theme]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            clearInterval(timer);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className="min-h-screen bg-theme-base text-theme-text font-sans selection:bg-theme-primary selection:text-theme-base flex flex-col overflow-hidden transition-colors duration-500 relative cursor-default">
            {/* Background Visuals (Z-0) */}
            <BackgroundLayer theme={settings.theme} />

            {/* Foreground HUD Visuals (Z-50, pointer-events-none) - Visual Overlay */}
            <ForegroundLayer theme={settings.theme} />

            {/* Header Bar (Z-40) - Best Practice: Top level UI, below pointer effects if they are 'screens', but accessible */}
            <header className="fixed top-0 left-0 right-0 z-40 select-none border-b border-theme-highlight/30 bg-theme-base/80 backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 max-w-[1920px] mx-auto">
                    {/* Brand / Logo */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 md:h-8 bg-theme-primary shadow-[0_0_10px_var(--color-primary)]"></div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tighter leading-none text-theme-text uppercase">
                                    Endfield Protocol
                                </h1>
                                <div className="text-[10px] font-mono text-theme-primary tracking-[0.3em] opacity-80 mt-1 hidden md:block">
                                    TERMINAL_V{pkg.version} // {isOnline ? 'SYSTEM_ONLINE' : 'SYSTEM_OFFLINE'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation & Status */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-1 p-1 bg-black/20 rounded-md border border-theme-highlight/30">
                            <Button
                                variant={currentView === View.DASHBOARD ? 'primary' : 'ghost'}
                                onClick={() => setCurrentView(View.DASHBOARD)}
                                className={`text-xs h-8 px-3 md:px-4 py-0 rounded-sm ${currentView === View.DASHBOARD ? '' : 'text-theme-dim'}`}
                                title={t('DASHBOARD')}
                            >
                                {/* Mobile Icon */}
                                <span className="md:hidden">
                                    <i className="ri-dashboard-line text-lg"></i>
                                </span>
                                {/* Desktop Text */}
                                <span className="hidden md:inline">{t('DASHBOARD')}</span>
                            </Button>
                            <div className="w-[1px] h-4 bg-theme-highlight/30 mx-1"></div>
                            <Button
                                variant={currentView === View.SETTINGS ? 'primary' : 'ghost'}
                                onClick={() => setCurrentView(View.SETTINGS)}
                                className={`text-xs h-8 px-3 md:px-4 py-0 rounded-sm ${currentView === View.SETTINGS ? '' : 'text-theme-dim'}`}
                                title={t('SYSTEM_CONFIG')}
                            >
                                {/* Mobile Icon */}
                                <span className="md:hidden">
                                    <i className="ri-settings-3-line text-lg"></i>
                                </span>
                                {/* Desktop Text */}
                                <span className="hidden md:inline">{t('SYSTEM_CONFIG')}</span>
                            </Button>
                        </div>

                        <div className="hidden md:flex flex-col items-end text-[10px] font-mono text-theme-dim border-l border-theme-highlight/30 pl-6">
                            <span className="text-theme-primary text-base leading-none tracking-widest">{now.toLocaleTimeString('en-US', { hour12: false })}</span>
                            <span className="opacity-70">{now.toISOString().split('T')[0]}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area (Z-10) */}
            <main className="flex-1 pt-24 md:pt-28 pb-8 px-4 md:px-12 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col custom-scrollbar">
                {currentView === View.SETTINGS ? (
                    <div className="max-w-4xl mx-auto w-full h-full pb-20 pt-6 px-2">
                        <Panel title={t('SYSTEM_CONFIG')} className="p-4 md:p-8 backdrop-blur-xl bg-theme-surface/80 mt-2">
                            <div className="space-y-10">
                                {/* Timers */}
                                <div className="space-y-4">
                                    <h3 className="text-theme-primary font-mono text-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                                        <span>{t('CYCLE_PARAMETERS')}</span>
                                        <span className="text-[10px] opacity-50">CONFIG_SECTOR_01</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('WORK_DURATION')}</label>
                                            <Input
                                                type="number"
                                                value={settings.workDuration}
                                                onChange={(e) => setSettings({ ...settings, workDuration: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('SHORT_BREAK_DURATION')}</label>
                                            <Input
                                                type="number"
                                                value={settings.shortBreakDuration}
                                                onChange={(e) => setSettings({ ...settings, shortBreakDuration: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('LONG_BREAK_DURATION')}</label>
                                            <Input
                                                type="number"
                                                value={settings.longBreakDuration}
                                                onChange={(e) => setSettings({ ...settings, longBreakDuration: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Appearance & Language */}
                                <div className="space-y-4">
                                    <h3 className="text-theme-primary font-mono text-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                                        <span>{t('INTERFACE_CUSTOMIZATION')}</span>
                                        <span className="text-[10px] opacity-50">CONFIG_SECTOR_02</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('LANGUAGE')}</label>
                                            <CustomSelect
                                                value={settings.language}
                                                options={[
                                                    { value: Language.EN, label: 'ENGLISH (US)' },
                                                    { value: Language.CN, label: '简体中文 (CN)' }
                                                ]}
                                                onChange={(value) => setSettings({ ...settings, language: value as Language })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('THEME')}</label>
                                            <CustomSelect
                                                value={settings.theme}
                                                options={[
                                                    { value: ThemePreset.ORIGIN, label: t('THEME_ORIGIN') },
                                                    { value: ThemePreset.AZURE, label: t('THEME_AZURE') },
                                                    { value: ThemePreset.NEON, label: t('THEME_NEON') },
                                                    { value: ThemePreset.MATRIX, label: t('THEME_MATRIX') },
                                                    { value: ThemePreset.TACTICAL, label: t('THEME_TACTICAL') },
                                                    { value: ThemePreset.ROYAL, label: t('THEME_ROYAL') },
                                                    { value: ThemePreset.INDUSTRIAL, label: t('THEME_INDUSTRIAL') },
                                                    { value: ThemePreset.LABORATORY, label: t('THEME_LABORATORY') }
                                                ]}
                                                onChange={(value) => setSettings({ ...settings, theme: value as ThemePreset })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-4">
                                    <h3 className="text-theme-primary font-mono text-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                                        <span>{t('AUTOMATION_FEEDBACK')}</span>
                                        <span className="text-[10px] opacity-50">CONFIG_SECTOR_03</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Checkbox
                                            checked={settings.autoStartBreaks}
                                            onChange={(checked) => setSettings({ ...settings, autoStartBreaks: checked })}
                                            label={t('AUTO_START_BREAK')}
                                        />
                                        <Checkbox
                                            checked={settings.autoStartWork}
                                            onChange={(checked) => setSettings({ ...settings, autoStartWork: checked })}
                                            label={t('AUTO_START_WORK')}
                                        />
                                        <Checkbox
                                            checked={settings.soundEnabled}
                                            onChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                                            label={t('AUDIO_FEEDBACK')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>
                ) : null}

                {/* Dashboard - Always rendered but hidden when in settings */}
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto max-w-7xl mx-auto w-full ${currentView === View.SETTINGS ? 'hidden' : ''}`}>
                    {/* Left: Pomodoro (Larger) */}
                    <div className="lg:col-span-7 flex flex-col h-auto min-h-[450px] md:h-[500px]">
                        <Pomodoro settings={settings} onSessionsUpdate={setSessionCount} />
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 flex flex-col gap-6 h-auto">
                        {/* Tasks */}
                        <div className="h-auto min-h-[200px]">
                            <TaskManager language={settings.language} />
                        </div>
                        {/* Audio */}
                        <div className="h-auto min-h-[160px] md:h-48 shrink-0">
                            <AudioPlayer language={settings.language} />
                        </div>
                    </div>

                    {/* Mobile Bottom Spacer */}
                    <div className="h-24 w-full md:hidden shrink-0"></div>
                </div>
            </main>
        </div>
    );
};

export default App;
