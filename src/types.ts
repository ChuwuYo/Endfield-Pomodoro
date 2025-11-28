
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

export const ThemePreset = {
  ENDFIELD: 'ENDFIELD',
  RHODES: 'RHODES',
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
  language: Language;
  theme: ThemePreset;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
