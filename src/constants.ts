/**
 * 存储键常量（localStorage / sessionStorage）
 * 用于统一管理所有存储的键名，避免拼写错误
 *
 * 使用位置：
 * - App.tsx: SETTINGS / SESSIONS / TOTAL_SECONDS
 * - Pomodoro.tsx: TIMER
 * - AudioPlayer.tsx: AUDIO_SOURCE
 */
export const STORAGE_KEYS = {
    /** 用户设置（番茄钟时长、主题、语言等） */
    SETTINGS: "origin_terminal_settings",
    /** 任务列表 */
    TASKS: "origin_terminal_tasks",
    /** 完成的番茄钟会话数 */
    SESSIONS: "origin_terminal_sessions",
    /** 累计学习总秒数 */
    TOTAL_SECONDS: "origin_terminal_total_seconds",
    /** 当前会话开始时间戳 */
    CURRENT_SESSION_START: "origin_terminal_current_session_start",
    /** 音频源模式（local/online） */
    AUDIO_SOURCE: "origin_terminal_audio_source",
    /** 音频音量（0-1） */
    AUDIO_VOLUME: "origin_terminal_audio_volume",
    /** 音频播放模式（sequence/loop/random） */
    AUDIO_PLAY_MODE: "origin_terminal_audio_play_mode",
    /** 计时器状态（用于刷新后恢复） */
    TIMER: "origin_terminal_timer",
} as const;

/**
 * 音乐 API 基础 URL
 * 用于获取在线音乐数据
 *
 * 主 API: api.i-meto.com
 * 备用 API: api.injahow.cn
 *
 * 使用位置：
 * - hooks/useMusicData.ts
 */
export const MUSIC_API_BASE_URL = "https://api.i-meto.com/meting/api";
export const MUSIC_API_FALLBACK_URL = "https://api.injahow.cn/meting/";

/**
 * 音频播放器常量
 *
 * 使用位置：
 * - hooks/useOnlinePlayer.ts
 * - hooks/useLocalPlayer.ts
 * - hooks/useMusicData.ts
 */
export const NEXT_TRACK_RETRY_DELAY_MS = 1000; // 音频加载失败后自动跳转下一曲的延迟（毫秒）
export const AUDIO_LOADING_TIMEOUT_MS = 15000; // 音频加载超时时间（毫秒）
export const PRELOAD_DELAY_MS = 3000; // 预加载延迟时间（毫秒），避免抢占当前播放带宽
export const TIME_UPDATE_THROTTLE_SECONDS = 0.25; // 时间更新节流阈值（秒），减少频繁重渲染
export const RESUME_TIME_BUFFER_SECONDS = 0.2; // 修复音轨后恢复播放时的时间回退缓冲（秒）
export const API_FETCH_DELAY_MS = 100; // API 数据获取延迟（毫秒），减少初始加载卡顿
// API 请求超时（毫秒）。适配器串行回退，最坏等待约为 API_FETCH_DELAY_MS + 各适配器超时之和。
// 总预算约 6.1s，落在 RAIL / Nielsen 的 1–10s 可容忍区间内（超过 10s 用户倾向放弃）。
// 预算向主源倾斜：主源数据新鲜，值得多等；备源实测 ~0.1s 返回，且数据可能陈旧，不必久候。
export const API_TIMEOUT_MS = 3000; // 未指定超时的适配器所用的默认值
export const PRIMARY_API_TIMEOUT_MS = 4000; // 主源实测 ~1.1s，留约 3.6 倍余量
export const FALLBACK_API_TIMEOUT_MS = 2000; // 备源实测 ~0.1s，余量已极充裕
export const ONLINE_CONSECUTIVE_ERROR_LIMIT = 5; // 在线播放连续加载失败达到该次数后停止自动切歌
export const TRACK_FIX_FAILURE_LIMIT = 2; // 单曲回退连续失败达到该次数后，整单切换到下一个 API 适配器

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
export const VISIBILITY_CHECK_MIN_INTERVAL_MS = 30 * 60 * 1000; // 页面从隐藏到可见后的最小检查间隔（毫秒）

/**
 * 番茄钟计时器常量
 *
 * 使用位置：
 * - Pomodoro.tsx
 */
export const TIMER_CHECK_INTERVAL_MS = 100; // 计时器精度检查间隔（毫秒）
export const LONG_BREAK_INTERVAL = 4; // 每完成多少个工作会话后进入长休息

/**
 * 任务列表常量
 *
 * 使用位置：
 * - TaskManager.tsx
 */
export const MAX_TASKS = 6; // 任务容量上限

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
