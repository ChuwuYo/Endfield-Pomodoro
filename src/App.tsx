import React, { useState, useEffect, useLayoutEffect } from 'react';
import Pomodoro from './components/Pomodoro';
import TaskManager from './components/TaskManager';
import AudioPlayer from './components/AudioPlayer';
import type { Settings } from './types';
import { Language, ThemePreset, TimerMode } from './types';
import { Panel, Input, BackgroundLayer, ForegroundLayer, Button } from './components/TerminalUI';
import { CustomSelect } from './components/CustomSelect';
import { Checkbox } from './components/Checkbox';
import { useTranslation } from './utils/i18n';
import { STORAGE_KEYS } from './constants';
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
    theme: ThemePreset.INDUSTRIAL,
    musicConfig: {
        server: 'netease',
        type: 'playlist',
        id: '9094583817'
    }
};

const View = {
    DASHBOARD: 'DASHBOARD',
    SETTINGS: 'SETTINGS'
} as const;
type View = typeof View[keyof typeof View];

// 扩展主题定义
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

// 音乐平台选项配置
const getMusicPlatformOptions = (t: ReturnType<typeof useTranslation>) => [
    { value: 'netease', label: t('PLATFORM_NETEASE') },
    { value: 'tencent', label: t('PLATFORM_TENCENT') },
    { value: 'kugou', label: t('PLATFORM_KUGOU') },
    { value: 'xiami', label: t('PLATFORM_XIAMI') },
    { value: 'baidu', label: t('PLATFORM_BAIDU') }
];

// 音乐类型选项配置
const getMusicTypeOptions = (t: ReturnType<typeof useTranslation>) => [
    { value: 'playlist', label: t('TYPE_PLAYLIST') },
    { value: 'album', label: t('TYPE_ALBUM') },
    { value: 'song', label: t('TYPE_SONG') },
    { value: 'artist', label: t('TYPE_ARTIST') }
];

const App: React.FC = () => {
    // 从localStorage加载设置
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return { ...DEFAULT_SETTINGS, ...parsed };
                }
            } catch (e) {
                console.error('Failed to load settings', e);
            }
        }
        return DEFAULT_SETTINGS;
    });

    // 从localStorage加载会话计数
    const [sessionCount, setSessionCount] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        return Number(saved) | 0;
    });

    // 当前活动会话中经过的秒数（仅用于累计学习时间，work 模式下更新）
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    // 持久化的累计学习总秒数（包含已完成的会话），用于在刷新后仍显示总学习时长
    const [persistedTotalSeconds, setPersistedTotalSeconds] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.TOTAL_SECONDS);
        return saved ? (Number(saved) || 0) : 0;
    });
    // 当前会话开始时间（时间戳毫秒），用于在刷新后继续计时当前会话
    const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_START);
        return saved ? (Number(saved) || null) : null;
    });
    // 计时器运行状态（任何模式，只要 timeLeft > 0 即视为运行）
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    // 用于在不可见标签页显示剩余时间：保存最近一次 tick 的剩余秒数与模式
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [remainingMode, setRemainingMode] = useState<TimerMode | null>(null);

    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [now, setNow] = useState(new Date());
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const t = useTranslation(settings.language);

    // 辅助函数：更新音乐配置
    const handleMusicConfigChange = (key: keyof Settings['musicConfig'], value: string) => {
        setSettings(prev => ({
            ...prev,
            musicConfig: {
                ...prev.musicConfig,
                [key]: value
            }
        }));
    };

    // 更新文档标题：当标签页不可见且计时器在运行时显示实时倒计时，否则显示应用标题
    useEffect(() => {
        const restoreTitle = () => { document.title = t('APP_TITLE'); };

        const handleVisibility = () => {
            if (!document.hidden) restoreTitle();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        if (document.hidden && isTimerRunning && remainingSeconds != null) {
            const remaining = Math.max(0, remainingSeconds);
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;
            const fmt = h > 0
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            // 休息时也显示模式标签（根据当前语言选择本地化短标签）
            const modeLabel = remainingMode && remainingMode !== TimerMode.WORK
                ? ` ${settings.language === Language.CN ? '休息' : 'Break'}`
                : '';
            document.title = `${fmt}${modeLabel} • ${t('APP_TITLE')}`;
        } else {
            // 仅在当前标题与默认标题不同时才恢复，避免在可见时每秒重复写入 document.title
            if (document.title !== t('APP_TITLE')) {
                restoreTitle();
            }
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            restoreTitle();
        };
    }, [isTimerRunning, remainingSeconds, remainingMode, t, settings.language]);

    // 持久化设置
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to persist settings', e);
        }
    }, [settings]);

    // 持久化会话计数
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.SESSIONS, sessionCount.toString());
        } catch (e) {
            console.error('Failed to persist session count', e);
        }
    }, [sessionCount]);

    // 应用主题
    useLayoutEffect(() => {
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

    // Timer state is restored by the Pomodoro component via onTick; do not duplicate by reading TIMER_STORAGE here.

    const clearCurrentSessionStart = () => {
        setCurrentSessionStart(null);
        try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_START);
        } catch (e) {
            console.error('Failed to remove current session start', e);
        }
    };
    // 计算总学习时间：
    // - persistedTotalSeconds: 已完成会话累积的秒数（持久化）
    // - 当前会话：优先使用 currentSessionStart（如果存在并且浏览器刷新后仍可计算），否则使用内存中的 elapsedSeconds
    // 使用外部的 now 状态以避免在渲染中调用 impure Date.now()
    const currentSessionElapsed = currentSessionStart
        ? Math.floor((now.getTime() - currentSessionStart) / 1000)
        : elapsedSeconds;
    const totalSeconds = persistedTotalSeconds + currentSessionElapsed;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return (
        <div className="h-[100dvh] bg-theme-base text-theme-text font-sans selection:bg-theme-primary selection:text-theme-base flex flex-col overflow-hidden transition-colors duration-500 relative cursor-default">
            {/* 背景视觉效果 (Z-0) */}
            <BackgroundLayer theme={settings.theme} />

            {/* 前景HUD视觉效果 (Z-50, pointer-events-none) - 视觉覆盖层 */}
            <ForegroundLayer theme={settings.theme} />

            {/* 头部栏 (Z-40) - 最佳实践：顶级UI，在指针效果下方如果它们是'屏幕'，但可访问 */}
            <header className="fixed top-0 left-0 right-0 z-40 select-none border-b border-theme-highlight/30 bg-theme-base/80 backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 max-w-[1920px] mx-auto">
                    {/* 品牌/Logo */}
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

                    {/* 导航和状态 */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-1 p-1 bg-black/20 rounded-md border border-theme-highlight/30">
                            <Button
                                variant={currentView === View.DASHBOARD ? 'primary' : 'ghost'}
                                onClick={() => setCurrentView(View.DASHBOARD)}
                                className={`text-xs h-8 px-3 md:px-4 py-0 rounded-sm ${currentView === View.DASHBOARD ? '' : 'text-theme-dim'}`}
                                title={t('DASHBOARD')}
                            >
                                {/* 移动端图标 */}
                                <span className="md:hidden">
                                    <i className="ri-dashboard-line text-lg"></i>
                                </span>
                                {/* 桌面端文本 */}
                                <span className="hidden md:inline">{t('DASHBOARD')}</span>
                            </Button>
                            <div className="w-[1px] h-4 bg-theme-highlight/30 mx-1"></div>
                            <Button
                                variant={currentView === View.SETTINGS ? 'primary' : 'ghost'}
                                onClick={() => setCurrentView(View.SETTINGS)}
                                className={`text-xs h-8 px-3 md:px-4 py-0 rounded-sm ${currentView === View.SETTINGS ? '' : 'text-theme-dim'}`}
                                title={t('SYSTEM_CONFIG')}
                            >
                                {/* 移动端图标 */}
                                <span className="md:hidden">
                                    <i className="ri-settings-3-line text-lg"></i>
                                </span>
                                {/* 桌面端文本 */}
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

            {/* 主要内容区域 (Z-10) */}
            <main className="flex-1 pt-24 md:pt-28 pb-8 px-4 md:px-12 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col custom-scrollbar">
                {currentView === View.SETTINGS ? (
                    <div className="max-w-4xl mx-auto w-full h-full pb-20 pt-6 px-2">
                        <Panel title={t('SYSTEM_CONFIG')} className="p-4 md:p-8 backdrop-blur-xl bg-theme-surface/80 mt-2">
                            <div className="space-y-10">
                                {/* 计时器 */}
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

                                {/* 外观和语言 */}
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

                                {/* 自动化与反馈 */}
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

                                {/* 在线音乐配置 */}
                                <div className="space-y-4">
                                    <h3 className="text-theme-primary font-mono text-sm uppercase border-b border-theme-highlight pb-2 flex justify-between">
                                        <span>{t('ONLINE_MUSIC_CONFIG')}</span>
                                        <span className="text-[10px] opacity-50">CONFIG_SECTOR_04</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('PLATFORM')}</label>
                                            <CustomSelect
                                                value={settings.musicConfig.server}
                                                options={getMusicPlatformOptions(t)}
                                                onChange={(value) => handleMusicConfigChange('server', value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('TYPE')}</label>
                                            <CustomSelect
                                                value={settings.musicConfig.type}
                                                options={getMusicTypeOptions(t)}
                                                onChange={(value) => handleMusicConfigChange('type', value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-mono text-theme-dim mb-2 uppercase tracking-wider">{t('ID')}</label>
                                            <Input
                                                type="text"
                                                value={settings.musicConfig.id}
                                                onChange={(e) => handleMusicConfigChange('id', e.target.value)}
                                                placeholder={t('ENTER_ID_PLACEHOLDER')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                        {/* 移动端底部额外间距，防止被 Footer 遮挡 */}
                        <div className="h-24 w-full md:hidden shrink-0"></div>
                    </div>
                ) : null}

                {/* 仪表板 - 始终渲染但在设置时隐藏 */}
                <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto max-w-7xl mx-auto w-full ${currentView === View.SETTINGS ? 'hidden' : ''}`}>
                    {/* 左侧：番茄钟（较大） */}
                    <div className="lg:col-span-7 flex flex-col h-auto min-h-[450px] md:h-[500px]">
                        <Pomodoro
                            settings={settings}
                            sessionCount={sessionCount}
                            onSessionsUpdate={(newCount) => {
                                setSessionCount(newCount);
                                // 会话完成：把当前会话的 elapsedSeconds（或基于 start 的值）累加到持久化总时长
                                const finishedElapsed = currentSessionStart
                                    ? Math.floor((now.getTime() - currentSessionStart) / 1000)
                                    : elapsedSeconds;
                                setPersistedTotalSeconds(prev => {
                                    const next = prev + finishedElapsed;
                                    try {
                                        localStorage.setItem(STORAGE_KEYS.TOTAL_SECONDS, String(next));
                                    } catch (e) {
                                        console.error('Failed to persist total seconds', e);
                                    }
                                    return next;
                                });
                                // 清理当前会话相关状态
                                setElapsedSeconds(0); // 重置经过时间
                                clearCurrentSessionStart();
                            }}
                            onTick={(timeLeft, mode, isActive) => {
                                const running = Boolean(isActive && timeLeft > 0);
                                setIsTimerRunning(running);
                                setRemainingSeconds(timeLeft);
                                setRemainingMode(mode);

                                if (mode === TimerMode.WORK) {
                                    const totalWorkSeconds = settings.workDuration * 60;
                                    const newElapsed = totalWorkSeconds - timeLeft;
                                    setElapsedSeconds(newElapsed);

                                    if (isActive) {
                                        // 如果当前会话还没有记录开始时间，则以当前时间减去已经经过秒数来计算开始时间，
                                        // 这样页面刷新后仍能基于时间戳继续计算当前会话的经过时间。
                                        if (!currentSessionStart && newElapsed > 0) {
                                            const startTs = Date.now() - newElapsed * 1000;
                                            setCurrentSessionStart(startTs);
                                            try {
                                                localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_START, String(startTs));
                                            } catch (e) {
                                                console.error('Failed to persist current session start', e);
                                            }
                                        }
                                    } else {
                                        // 已暂停：清理 currentSessionStart，避免 footer 继续基于时间戳累加
                                        if (currentSessionStart) {
                                            clearCurrentSessionStart();
                                        }
                                    }
                                } else {
                                    // 休息时间不计入学习时长，确保 currentSessionStart 被清理
                                    setElapsedSeconds(0);
                                    if (currentSessionStart) {
                                        clearCurrentSessionStart();
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* 右侧列 */}
                    <div className="lg:col-span-5 flex flex-col gap-6 h-auto">
                        {/* 任务 */}
                        <div className="h-auto min-h-[200px]">
                            <TaskManager language={settings.language} />
                        </div>
                        {/* 音频 */}
                        <div className="h-auto min-h-[160px] md:h-48 shrink-0">
                            <AudioPlayer language={settings.language} musicConfig={settings.musicConfig} />
                        </div>
                    </div>

                    {/* 移动端底部间距 */}
                    <div className="h-24 w-full md:hidden shrink-0"></div>
                </div>
            </main>

            {/* 页脚 (Z-40) */}
            <footer className="relative z-40 border-t border-theme-highlight/30 bg-theme-base/80 backdrop-blur-md text-[10px] font-mono text-theme-dim py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] select-none">
                <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-theme-primary/80 uppercase tracking-wider">{t('TOTAL_STUDY_TIME')}:</span>
                        <span className="text-theme-text">
                            {hours > 0 ? (
                                <>
                                    <span className="mr-1">{hours}<span className="text-theme-dim ml-0.5">{t('HOURS')}</span></span>
                                    <span className="mr-1">{minutes}<span className="text-theme-dim ml-0.5">{t('MINUTES')}</span></span>
                                    <span>{seconds}<span className="text-theme-dim ml-0.5">{t('SECONDS')}</span></span>
                                </>
                            ) : minutes > 0 ? (
                                <>
                                    <span className="mr-1">{minutes}<span className="text-theme-dim ml-0.5">{t('MINUTES')}</span></span>
                                    <span>{seconds}<span className="text-theme-dim ml-0.5">{t('SECONDS')}</span></span>
                                </>
                            ) : (
                                <span>{seconds}<span className="text-theme-dim ml-0.5">{t('SECONDS')}</span></span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 opacity-60 hover:opacity-100 transition-opacity">
                        <span>{t('COPYRIGHT')}</span>
                        <span className="hidden md:inline text-theme-highlight">|</span>
                        <a
                            href="https://github.com/ChuwuYo/Endfield-Pomodoro"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-1 hover:text-theme-primary transition-colors"
                        >
                            <i className="ri-github-fill"></i>
                            <span>@ChuwuYo</span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;