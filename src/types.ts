
export const TimerMode = {
  WORK: 'WORK',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK'
} as const;
export type TimerMode = typeof TimerMode[keyof typeof TimerMode];

export const Language = {
  EN: 'EN',
  CN: 'CN'
} as const;
export type Language = typeof Language[keyof typeof Language];

export const PlayMode = {
  SEQUENCE: 'sequence',
  LOOP: 'loop',
  RANDOM: 'random'
} as const;
export type PlayMode = typeof PlayMode[keyof typeof PlayMode];

export const ThemePreset = {
  ORIGIN: 'ORIGIN',
  AZURE: 'AZURE',
  NEON: 'NEON',
  MATRIX: 'MATRIX',
  TACTICAL: 'TACTICAL',
  ROYAL: 'ROYAL',
  INDUSTRIAL: 'INDUSTRIAL',
  LABORATORY: 'LABORATORY'
} as const;
export type ThemePreset = typeof ThemePreset[keyof typeof ThemePreset];

export const AudioMode = {
  SEQUENTIAL: 'SEQUENTIAL',
  SHUFFLE: 'SHUFFLE',
  REPEAT_ONE: 'REPEAT_ONE'
} as const;
export type AudioMode = typeof AudioMode[keyof typeof AudioMode];

export interface Settings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  language: Language;
  theme: ThemePreset;
  musicConfig: {
    server: string;
    type: string;
    id: string;
  };
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
