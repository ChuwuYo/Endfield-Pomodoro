
import { Language } from '../types';

export const translations = {
  [Language.EN]: {
    // App
    APP_TITLE: 'Endfield Protocol',
    DASHBOARD: 'DASHBOARD',
    SYSTEM_CONFIG: 'SYSTEM CONFIG',
    SYSTEM_TIME: 'SYS.TIME',

    // Settings
    WORK_DURATION: 'WORK CYCLE (MIN)',
    SHORT_BREAK_DURATION: 'MAINTENANCE (S)',
    LONG_BREAK_DURATION: 'REBOOT (L)',
    AUTO_START_BREAK: 'AUTO-SEQ BREAK',
    AUTO_START_WORK: 'AUTO-SEQ WORK',
    AUDIO_FEEDBACK: 'SFX SYSTEM',
    LANGUAGE: 'LANGUAGE',
    THEME: 'UI THEME',
    CYCLE_PARAMETERS: 'CYCLE PARAMETERS',
    INTERFACE_CUSTOMIZATION: 'INTERFACE CUSTOMIZATION',
    AUTOMATION_FEEDBACK: 'AUTOMATION & FEEDBACK',

    // Themes
    THEME_ORIGIN: 'PRESET_01: ENDFIELD_PROTOCOL',
    THEME_AZURE: 'PRESET_02: AZURE_ARCHIVE',
    THEME_NEON: 'PRESET_03: NEON_CITY',
    THEME_MATRIX: 'PRESET_04: MATRIX_CODE',
    THEME_TACTICAL: 'PRESET_05: DESERT_OPS',
    THEME_ROYAL: 'PRESET_06: ROYAL_VIOLET',
    THEME_INDUSTRIAL: 'PRESET_07: HEAVY_INDUSTRY (LIGHT)',
    THEME_LABORATORY: 'PRESET_08: SCIENCE_LAB (LIGHT)',

    // Pomodoro
    CHRONO_MODULE: 'CHRONO MODULE',
    STATUS: 'STATUS',
    TIME_REMAINING: 'T-MINUS',
    INITIALIZE: 'INIT',
    PAUSE: 'HALT',
    SESSIONS_COMPLETED: 'CYCLES',
    MODE_WORK: 'OPERATIONAL',
    MODE_SHORT: 'COOLDOWN',
    MODE_LONG: 'HIBERNATION',
    STANDBY: 'STANDBY',
    PAUSED_STATUS: 'PAUSED',

    // Task Manager
    TASK_MODULE: 'MISSION PROTOCOLS',
    ADD_TASK_PLACEHOLDER: 'Input objective parameters...',
    ADD_TASK: 'ADD',
    NO_TASKS: 'NO ACTIVE OBJECTIVES',
    TASKS_CLEARED: 'ALL OBJECTIVES CLEARED',
    CLEAR_COMPLETED: 'PURGE COMPLETED',
    CAPACITY: 'CAPACITY',

    // Audio Player
    AUDIO_MODULE: 'AUDIO FEED',
    SELECT_TRACK: 'LOAD FREQUENCY',
    NO_TRACK: 'NO SIGNAL',
    PLAYING: 'BROADCASTING',
    PAUSED: 'SUSPENDED',
    NEXT_TRACK: 'NEXT FREQ',
    MODE_SEQ: 'SEQ',
    MODE_SHUFFLE: 'RND',
    MODE_REPEAT_ONE: 'REPEAT ONE',
    MODE_REPEAT_ONE_SHORT: 'ONE',
    PLAYLIST_COUNT: 'TRACKS',
    PLAYLIST_BUTTON: 'LIST',
    TOGGLE_MODE: 'TOGGLE PLAYBACK MODE',
    FILES_LOADED: 'FILES LOADED',
    CLEAR: 'CLEAR',
    
    // Button Tooltips
    PLAY_PAUSE: 'PLAY/PAUSE',
    RESET_TIMER: 'RESET TIMER',
    SKIP_TIMER: 'SKIP TO NEXT',
    TOGGLE_TASK: 'TOGGLE TASK',
    DELETE_TASK: 'DELETE TASK',
    CLEAR_ALL_TASKS: 'CLEAR ALL TASKS',

    // Footer
    TOTAL_STUDY_TIME: 'SESSION OPERATION TIME',
    COPYRIGHT: '© 2025 ENDFIELD PROTOCOL. ALL RIGHTS RESERVED.',
    HOURS: 'H',
    MINUTES: 'M',
    SECONDS: 'S',
  },
  [Language.CN]: {
    // App
    APP_TITLE: '末端协议-番茄钟',
    DASHBOARD: '总控台',
    SYSTEM_CONFIG: '系统设置',
    SYSTEM_TIME: '系统时间',

    // Settings
    WORK_DURATION: '作业周期 (分)',
    SHORT_BREAK_DURATION: '短程维护 (分)',
    LONG_BREAK_DURATION: '系统重启 (分)',
    AUTO_START_BREAK: '自动休眠序列',
    AUTO_START_WORK: '自动作业序列',
    AUDIO_FEEDBACK: '提示音效',
    LANGUAGE: '语言选项',
    THEME: '视觉主题',
    CYCLE_PARAMETERS: '循环参数',
    INTERFACE_CUSTOMIZATION: '界面定制',
    AUTOMATION_FEEDBACK: '自动化与反馈',

    // Themes
    THEME_ORIGIN: '预设_01: 末端协议',
    THEME_AZURE: '预设_02: 蔚蓝档案',
    THEME_NEON: '预设_03: 霓虹都市',
    THEME_MATRIX: '预设_04: 矩阵代码',
    THEME_TACTICAL: '预设_05: 荒漠行动',
    THEME_ROYAL: '预设_06: 皇家紫罗兰',
    THEME_INDUSTRIAL: '预设_07: 重工灰烬 (亮色)',
    THEME_LABORATORY: '预设_08: 科学实验 (亮色)',

    // Pomodoro
    CHRONO_MODULE: '计时模块',
    STATUS: '当前状态',
    TIME_REMAINING: '剩余时间',
    INITIALIZE: '启动',
    PAUSE: '中断',
    SESSIONS_COMPLETED: '完成周期',
    MODE_WORK: '作业中',
    MODE_SHORT: '冷却模式',
    MODE_LONG: '深度休眠',
    STANDBY: '待机中',
    PAUSED_STATUS: '已暂停',

    // Task Manager
    TASK_MODULE: '任务协议',
    ADD_TASK_PLACEHOLDER: '输入任务指令...',
    ADD_TASK: '添加',
    NO_TASKS: '无当前任务',
    TASKS_CLEARED: '任务列表已清空',
    CLEAR_COMPLETED: '清除已完成',
    CAPACITY: '容量',

    // Audio Player
    AUDIO_MODULE: '音频讯号',
    SELECT_TRACK: '加载音频',
    NO_TRACK: '无信号',
    PLAYING: '播放中',
    PAUSED: '已暂停',
    NEXT_TRACK: '下一频段',
    MODE_SEQ: '顺序',
    MODE_SHUFFLE: '随机',
    MODE_REPEAT_ONE: '单曲循环',
    MODE_REPEAT_ONE_SHORT: '单曲',
    PLAYLIST_COUNT: '曲目',
    PLAYLIST_BUTTON: '播放列表',
    TOGGLE_MODE: '切换播放模式',
    FILES_LOADED: '已加载文件',
    CLEAR: '清空',
    
    // Button Tooltips
    PLAY_PAUSE: '播放/暂停',
    RESET_TIMER: '重置计时器',
    SKIP_TIMER: '跳过到下一阶段',
    TOGGLE_TASK: '切换任务状态',
    DELETE_TASK: '删除任务',
    CLEAR_ALL_TASKS: '清除所有任务',

    // Footer
    TOTAL_STUDY_TIME: '本次累计作业时长',
    COPYRIGHT: '© 2025 末端协议. 版权所有.',
    HOURS: '小时',
    MINUTES: '分钟',
    SECONDS: '秒',
  }
};

export const useTranslation = (lang: Language) => {
  return (key: keyof typeof translations['EN']) => {
    return translations[lang][key] || key;
  };
};
