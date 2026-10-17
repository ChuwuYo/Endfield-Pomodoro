export const STORAGE_KEYS = {
    SETTINGS: "origin_terminal_settings",
    TASKS: "origin_terminal_tasks",
    SESSIONS: "origin_terminal_sessions",
    TOTAL_SECONDS: "origin_terminal_total_seconds",
    CURRENT_SESSION_START: "origin_terminal_current_session_start",
    AUDIO_SOURCE: "origin_terminal_audio_source",
    AUDIO_VOLUME: "origin_terminal_audio_volume",
    AUDIO_PLAY_MODE: "origin_terminal_audio_play_mode",
    TIMER: "origin_terminal_timer",
} as const;

export const MUSIC_API_URLS = [
    "https://api.injahow.cn/meting/",
    "https://meting.furwolf.com/api",
    "https://meting.api.418121.xyz/api",
    "https://meting.jinghuashang.cn/",
] as const;

export const NEXT_TRACK_RETRY_DELAY_MS = 1000;
export const AUDIO_LOADING_TIMEOUT_MS = 15000;
export const PRELOAD_DELAY_MS = 3000;
export const TIME_UPDATE_THROTTLE_SECONDS = 0.25;
export const RESUME_TIME_BUFFER_SECONDS = 0.2; // 修复音轨后恢复播放时的时间回退缓冲（秒）
export const API_FETCH_DELAY_MS = 100;
// 主源数据新鲜，给更长超时；备源响应快但数据可能陈旧
export const API_TIMEOUT_MS = 3000;
export const PRIMARY_API_TIMEOUT_MS = 4000;
export const FALLBACK_API_TIMEOUT_MS = 2000;
export const ONLINE_CONSECUTIVE_ERROR_LIMIT = 5; // 连续加载失败达到该次数后停止自动切歌
export const TRACK_FIX_FAILURE_LIMIT = 2; // 单曲回退连续失败达到该次数后切换适配器
export const MEDIA_SESSION_SEEK_OFFSET_SECONDS = 10;
export const MEDIA_SESSION_POSITION_DRIFT_SECONDS = 1;

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const MINUTES_PER_HOUR = 60;
export const HOURLY_CHECK_INTERVAL_MS = 60 * 60 * 1000;
export const VISIBILITY_CHECK_MIN_INTERVAL_MS = 30 * 60 * 1000;
export const MANUAL_UPDATE_CHECK_TIMEOUT_MS = 15 * 1000;
export const MANUAL_UPDATE_RESULT_RESET_MS = 4 * 1000;

export const TIMER_CHECK_INTERVAL_MS = 100;
export const LONG_BREAK_INTERVAL = 4; // 每完成多少个工作会话后进入长休息

export const MAX_TASKS = 6;

export const SOUND_START_DURATION = 0.3;
export const SOUND_END_DURATION = 0.5;
export const SOUND_TICK_DURATION = 0.05;
export const SOUND_START_RAMP = 0.1;
