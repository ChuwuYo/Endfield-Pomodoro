import React, { useState, useEffect, useRef } from 'react';
import { TimerMode } from '../types';
import type { Settings } from '../types';
import { useSound } from './SoundManager';
import { Button, Panel } from './TerminalUI';
import { useTranslation } from '../utils/i18n';

interface PomodoroProps {
  settings: Settings;
  sessionCount: number;
  onSessionsUpdate: (count: number) => void;
  // 将 isActive 明确传递给父组件，方便父组件区分「有剩余但已暂停」与「正在运行」
  onTick?: (timeLeft: number, mode: TimerMode, isActive: boolean) => void;
}

// 持久化计时器负载类型
type TimerPayload = {
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  startTs?: number;
};

const Pomodoro: React.FC<PomodoroProps> = ({ settings, sessionCount, onSessionsUpdate, onTick }) => {
  const t = useTranslation(settings.language);
  const playSound = useSound(settings.soundEnabled, settings.soundVolume);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // 在恢复流程期间阻止 resetTimer 覆盖恢复的计时状态
  const restoredRef = useRef(false);
 
  // 本地持久化键（用于在刷新后恢复计时器状态）
  const TIMER_STORAGE = 'origin_terminal_timer';
 
  // 本地状态：模式、剩余时间、是否激活
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState<number>(() => settings.workDuration * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
 
  // 从 localStorage 恢复计时器（仅在挂载时执行）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;

      const candidateMode = parsed.mode as TimerMode | undefined;
      const candidateTime = typeof parsed.timeLeft === 'number' ? parsed.timeLeft : null;
      const candidateActive = Boolean(parsed.isActive);
      const candidateStart = typeof parsed.startTs === 'number' ? parsed.startTs : null;

      let restoredMode: TimerMode | undefined;
      let restoredTime: number | null = null;
      let restoredActive = false;
      let restoredStart: number | null = null;

      if (candidateMode) restoredMode = candidateMode;

      if (candidateTime != null) {
        let restored = candidateTime;
        if (candidateActive && candidateStart) {
          const elapsed = Math.floor((Date.now() - candidateStart) / 1000);
          restored = Math.max(0, candidateTime - elapsed);
          restoredStart = candidateStart;
        }
        restoredTime = restored;
        restoredActive = Boolean(candidateActive && restored > 0);
      }

      // 将多个 state 更新合并并标记为已恢复，避免随后 resetTimer 覆盖
      if (restoredMode !== undefined || restoredTime !== null || restoredActive || restoredStart !== null) {
        restoredRef.current = true;
        if (restoredMode !== undefined) setMode(restoredMode);
        if (restoredTime !== null) setTimeLeft(restoredTime);
        setIsActive(restoredActive);
        if (restoredStart !== null) {
          // 如果是工作模式并且存在 startTs，应用到父级统计（通过 onTick 父组件会同步 start）
          // 这里仅触发一次 onTick 以同步外部状态（包含 isActive）
          if (onTick) onTick(restoredTime as number, restoredMode ?? TimerMode.WORK, restoredActive);
        } else {
          if (restoredTime !== null && onTick) onTick(restoredTime, restoredMode ?? TimerMode.WORK, restoredActive);
        }
      }
    } catch (err) {
      // 解析失败时记录错误，便于调试
      console.error('Failed to parse timer payload from localStorage', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 将计时器状态持久化到 localStorage（mode / timeLeft / isActive 变化时更新）
  useEffect(() => {
    try {
      const payload: TimerPayload = { mode, timeLeft, isActive };
      if (isActive) {
        // 计算当前会话的起始时间戳，便于刷新后继续计时
        const total = getTotalTime();
        const elapsed = total - timeLeft;
        payload.startTs = Date.now() - elapsed * 1000;
      }
      localStorage.setItem(TIMER_STORAGE, JSON.stringify(payload));
    } catch (err) {
      // 持久化失败时记录错误但不影响运行
      console.error('Failed to persist timer payload to localStorage', err);
    }
    // 依赖包括 settings 的周期性参数，防止 totalTime 变化导致不一致
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLeft, isActive, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);
 
  useEffect(() => {
    // 如果刚刚从 localStorage 恢复过来，跳过本次 reset（避免覆盖恢复的剩余时间/运行状态）
    if (restoredRef.current) {
      restoredRef.current = false;
      return;
    }
    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const resetTimer = () => {
    setIsActive(false);
    let newTime = 0;
    switch (mode) {
      case TimerMode.WORK:
        newTime = settingsRef.current.workDuration * 60;
        break;
      case TimerMode.SHORT_BREAK:
        newTime = settingsRef.current.shortBreakDuration * 60;
        break;
      case TimerMode.LONG_BREAK:
        newTime = settingsRef.current.longBreakDuration * 60;
        break;
    }
    setTimeLeft(newTime);
    // reset 时明确告诉父组件已停止（isActive = false）
    if (onTick) onTick(newTime, mode, false);
  };

  useEffect(() => {
    let interval: number | undefined;
  
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          // tick 时明确传递当前运行状态（isActive = true）
          if (onTick) onTick(newTime, mode, true);
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
  
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    playSound('end');
    setIsActive(false);

    if (mode === TimerMode.WORK) {
      const newCount = sessionCount + 1;
      onSessionsUpdate(newCount);

      if (newCount % 4 === 0) {
        setMode(TimerMode.LONG_BREAK);
        if (settingsRef.current.autoStartBreaks) setIsActive(true);
      } else {
        setMode(TimerMode.SHORT_BREAK);
        if (settingsRef.current.autoStartBreaks) setIsActive(true);
      }
    } else {
      setMode(TimerMode.WORK);
      if (settingsRef.current.autoStartWork) setIsActive(true);
    }
  };

  const toggleTimer = () => {
    if (!isActive) playSound('start');
    const next = !isActive;
    setIsActive(next);
    // 主动通知父组件当前剩余时间、模式与运行状态，确保在暂停/恢复时父组件（footer/title）立即同步状态
    if (onTick) onTick(timeLeft, mode, next);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTotalTime = () => {
    return mode === TimerMode.WORK ? settings.workDuration * 60
      : mode === TimerMode.SHORT_BREAK ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60;
  };

  const progress = (() => {
    const total = getTotalTime();
    return ((total - timeLeft) / total) * 100;
  })();

  const getStatusText = () => {
    if (!isActive) {
      if (timeLeft === getTotalTime()) {
        return t('STANDBY');
      }
      return t('PAUSED_STATUS');
    }
    switch (mode) {
      case TimerMode.WORK: return t('MODE_WORK');
      case TimerMode.SHORT_BREAK: return t('MODE_SHORT');
      case TimerMode.LONG_BREAK: return t('MODE_LONG');
      default: return t('MODE_WORK');
    }
  };

  return (
    <Panel className="w-full h-full p-8" title={t('CHRONO_MODULE')}>
      <div className="flex flex-col h-full w-full items-center justify-between relative">
        {/* 顶部信息 */}
        <div className="w-full flex justify-between items-start border-b border-theme-highlight/30 pb-4 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-theme-dim tracking-widest uppercase mb-1">{t('STATUS')}</span>
            <div className={`text-xl font-mono font-bold tracking-widest ${isActive ? (mode === TimerMode.WORK ? 'text-theme-primary' : 'text-theme-secondary') : 'text-theme-dim'}`}>
              {getStatusText()}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-theme-dim tracking-widest uppercase mb-1">{t('SESSIONS_COMPLETED')}</span>
            <div className="text-2xl font-mono text-theme-text">{sessionCount.toString().padStart(2, '0')}</div>
          </div>
        </div>

        {/* 计时器显示 */}
        <div className="flex-1 w-full flex items-center justify-center relative py-8 min-h-0">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0 group">
            {/* 脉冲背景环（呼吸效果） */}
            {isActive && (
              <div className="absolute inset-0 rounded-full border-2 border-theme-primary/30 animate-ping-slow"></div>
            )}

            <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(var(--color-primary),0.2)]" viewBox="0 0 256 256">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-secondary)" />
                </linearGradient>
              </defs>
              {/* 轨道 */}
              <circle
                className="text-theme-highlight/20"
                strokeWidth="2"
                stroke="currentColor"
                fill="transparent"
                r="120"
                cx="128"
                cy="128"
              />
              {/* 进度 */}
              <circle
                className={`${mode === TimerMode.WORK ? 'text-theme-primary' : 'text-theme-accent'} transition-all duration-1000 ease-linear`}
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 120}
                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                strokeLinecap="round"
                stroke="currentColor" // Uses text color which we override via class if needed, or stick to solid
                fill="transparent"
                r="120"
                cx="128"
                cy="128"
                style={{ filter: 'drop-shadow(0 0 4px var(--color-primary))' }}
              />
              {/* 发光尖端 */}
              <circle
                fill="var(--color-text)"
                r="4"
                cx="248"
                cy="128"
                className="transition-all duration-1000 ease-linear"
                style={{
                  transformOrigin: '128px 128px',
                  transform: `rotate(${progress * 3.6}deg)`
                }}
              />
            </svg>

            {/* 内部装饰元素 */}
            <div className={`absolute inset-8 border border-theme-highlight/20 rounded-full opacity-50 border-dashed ${isActive ? 'animate-spin-slow' : ''}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[90%] h-[1px] bg-theme-highlight/10 absolute rotate-45"></div>
              <div className="w-[90%] h-[1px] bg-theme-highlight/10 absolute -rotate-45"></div>
            </div>

            {/* 时间文本 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <span className={`text-5xl md:text-7xl font-mono font-bold text-theme-text drop-shadow-2xl tabular-nums transition-transform ${isActive ? 'scale-105' : 'scale-100'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-theme-dim font-mono mt-2 tracking-[0.3em] uppercase animate-pulse">{t('TIME_REMAINING')}</span>
            </div>
          </div>
        </div>

        {/* 控制 */}
        <div className="w-full grid grid-cols-4 gap-4 mt-4 shrink-0">
          <Button onClick={toggleTimer} variant={isActive ? "secondary" : "primary"} className="col-span-2 h-14 text-lg" title={isActive ? t('PAUSE') : t('INITIALIZE')}>
            {isActive ? t('PAUSE') : t('INITIALIZE')}
          </Button>
          <Button onClick={resetTimer} variant="ghost" className="col-span-1 h-14 border border-theme-highlight/30 hover:border-theme-primary" title={t('RESET_TIMER')}>
            <i className="ri-restart-line text-2xl"></i>
          </Button>
          <Button onClick={handleComplete} variant="ghost" className="col-span-1 h-14 border border-theme-highlight/30 hover:border-theme-primary" title={t('SKIP_TIMER')}>
            <i className="ri-skip-forward-line text-2xl"></i>
          </Button>
        </div>
      </div>
    </Panel>
  );
};

export default Pomodoro;