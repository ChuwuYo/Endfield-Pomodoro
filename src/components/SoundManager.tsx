import { useCallback } from 'react';
import { SOUND_START_DURATION, SOUND_END_DURATION, SOUND_TICK_DURATION, SOUND_START_RAMP } from '../constants';

// 简单的振荡器蜂鸣声
const playBeep = (vol: number = 0.5, type: 'start' | 'end' | 'tick' = 'tick') => {
  const AudioContext = window.AudioContext || (window as Window & { webkitAudioContext?: typeof window.AudioContext }).webkitAudioContext;
  if (!AudioContext) return;

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'start') {
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + SOUND_START_RAMP);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + SOUND_START_DURATION);
    osc.start(now);
    osc.stop(now + SOUND_START_DURATION);
  } else if (type === 'end') {
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + SOUND_END_DURATION);
    // 双重蜂鸣
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + SOUND_END_DURATION);
    osc.start(now);
    osc.stop(now + SOUND_END_DURATION);
  } else {
    // 滴答声
    osc.frequency.setValueAtTime(1000, now);
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + SOUND_TICK_DURATION);
    osc.start(now);
    osc.stop(now + SOUND_TICK_DURATION);
  }
};

export const useSound = (enabled: boolean, volume: number) => {
  return useCallback((type: 'start' | 'end' | 'tick') => {
    if (enabled) {
      playBeep(volume, type);
    }
  }, [enabled, volume]);
};