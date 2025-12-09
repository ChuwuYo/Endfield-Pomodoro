/**
 * LocalStorage 存储键常量
 * 用于统一管理所有本地存储的键名，避免拼写错误
 * 
 * 使用位置：
 * - App.tsx: 所有键
 * - AudioPlayer.tsx: AUDIO_SOURCE
 */
export const STORAGE_KEYS = {
    /** 用户设置（番茄钟时长、主题、语言等） */
    SETTINGS: 'origin_terminal_settings',
    /** 完成的番茄钟会话数 */
    SESSIONS: 'origin_terminal_sessions',
    /** 累计学习总秒数 */
    TOTAL_SECONDS: 'origin_terminal_total_seconds',
    /** 当前会话开始时间戳 */
    CURRENT_SESSION_START: 'origin_terminal_current_session_start',
    /** 音频源模式（local/online） */
    AUDIO_SOURCE: 'origin_terminal_audio_source',
    /** 计时器状态（用于刷新后恢复） */
    TIMER: 'origin_terminal_timer'
} as const;

/**
 * Meting API 基础 URL
 * 用于获取在线音乐数据
 * 
 * 使用位置：
 * - hooks/useMetingData.ts
 */
export const METING_API_BASE_URL = 'https://api.injahow.cn/meting/';

/**
 * 音频播放器常量
 * 
 * 使用位置：
 * - hooks/useOnlinePlayer.ts
 * - hooks/useLocalPlayer.ts
 * - hooks/useMetingData.ts
 */
export const NEXT_TRACK_RETRY_DELAY_MS = 1000; // 音频加载失败后自动跳转下一曲的延迟（毫秒）
export const TOAST_DURATION_MS = 4000; // 提示消息显示时长（毫秒）
export const AUDIO_LOADING_TIMEOUT_MS = 5000; // 音频加载超时时间（毫秒）
export const TIME_UPDATE_THROTTLE_SECONDS = 0.25; // 时间更新节流阈值（秒），减少频繁重渲染
export const API_FETCH_DELAY_MS = 100; // API 数据获取延迟（毫秒），减少初始加载卡顿

/**
 * 时间转换常量
 * 
 * 使用位置：
 * - App.tsx
 * - Pomodoro.tsx
 * - PWAPrompt.tsx
 */
export const MS_PER_SECOND = 1000; // 毫秒转秒的转换系数
export const SECONDS_PER_MINUTE = 60; // 秒转分钟的转换系数
export const SECONDS_PER_HOUR = 3600; // 秒转小时的转换系数
export const MINUTES_PER_HOUR = 60; // 分钟转小时的转换系数
export const HOURLY_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 每小时检查间隔（毫秒）

/**
 * 番茄钟计时器常量
 * 
 * 使用位置：
 * - Pomodoro.tsx
 */
export const TIMER_CHECK_INTERVAL_MS = 100; // 计时器精度检查间隔（毫秒）
export const LONG_BREAK_INTERVAL = 4; // 每完成多少个工作会话后进入长休息

/**
 * 音效时长常量（秒）
 * 
 * 使用位置：
 * - SoundManager.tsx
 */
export const SOUND_START_DURATION = 0.3; // 开始音效时长
export const SOUND_END_DURATION = 0.5; // 结束音效时长
export const SOUND_TICK_DURATION = 0.05; // 滴答音效时长
export const SOUND_START_RAMP = 0.1; // 开始音效频率变化时长
