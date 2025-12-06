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
    AUDIO_SOURCE: 'origin_terminal_audio_source'
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
 */
export const NEXT_TRACK_RETRY_DELAY_MS = 1000; // 音频加载失败后自动跳转下一曲的延迟（毫秒）
export const TOAST_DURATION_MS = 4000; // 提示消息显示时长（毫秒）
export const AUDIO_LOADING_TIMEOUT_MS = 5000; // 音频加载超时时间（毫秒）
export const TIME_UPDATE_THROTTLE_SECONDS = 0.25; // 时间更新节流阈值（秒），减少频繁重渲染

/**
 * 时间转换常量
 * 
 * 使用位置：
 * - App.tsx
 */
export const MS_PER_SECOND = 1000; // 毫秒转秒的转换系数
