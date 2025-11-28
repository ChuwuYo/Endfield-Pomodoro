
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
}

const Pomodoro: React.FC<PomodoroProps> = ({ settings, sessionCount, onSessionsUpdate }) => {
  const t = useTranslation(settings.language);
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  // Removed local state for completedSessions to rely on props
  const playSound = useSound(settings.soundEnabled, settings.soundVolume);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    resetTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]);

  const resetTimer = () => {
    setIsActive(false);
    switch (mode) {
      case TimerMode.WORK:
        setTimeLeft(settingsRef.current.workDuration * 60);
        break;
      case TimerMode.SHORT_BREAK:
        setTimeLeft(settingsRef.current.shortBreakDuration * 60);
        break;
      case TimerMode.LONG_BREAK:
        setTimeLeft(settingsRef.current.longBreakDuration * 60);
        break;
    }
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
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
    setIsActive(!isActive);
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
        {/* Top Info */}
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

        {/* Timer Display */}
        <div className="flex-1 w-full flex items-center justify-center relative py-8 min-h-0">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0 group">
            {/* Pulsing Back Ring (Breathing Effect) */}
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
              {/* Track */}
              <circle
                className="text-theme-highlight/20"
                strokeWidth="2"
                stroke="currentColor"
                fill="transparent"
                r="120"
                cx="128"
                cy="128"
              />
              {/* Progress */}
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
              {/* Glow Tip */}
              <circle
                fill="var(--color-text)"
                r="4"
                cx="128"
                cy="8"
                className="transition-all duration-1000 ease-linear"
                style={{
                  transformOrigin: '128px 128px',
                  transform: `rotate(${progress * 3.6}deg)`
                }}
              />
            </svg>

            {/* Inner Decorative Elements */}
            <div className={`absolute inset-8 border border-theme-highlight/20 rounded-full opacity-50 border-dashed ${isActive ? 'animate-spin-slow' : ''}`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[90%] h-[1px] bg-theme-highlight/10 absolute rotate-45"></div>
              <div className="w-[90%] h-[1px] bg-theme-highlight/10 absolute -rotate-45"></div>
            </div>

            {/* Time Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <span className={`text-6xl md:text-8xl font-sans font-bold tracking-tighter text-theme-text drop-shadow-2xl tabular-nums transition-transform ${isActive ? 'scale-105' : 'scale-100'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-theme-dim font-mono mt-2 tracking-[0.3em] uppercase animate-pulse">{t('TIME_REMAINING')}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
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
