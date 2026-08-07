import { useCallback } from "react";
import {
    SOUND_END_DURATION,
    SOUND_START_DURATION,
    SOUND_START_RAMP,
    SOUND_TICK_DURATION,
} from "../constants";

type BeepType = "start" | "end" | "tick";

/** 模块级单例：避免每次蜂鸣 new AudioContext() 耗尽浏览器配额 */
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof window.AudioContext })
            .webkitAudioContext;
    if (!AudioContextCtor) return null;

    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
        sharedAudioContext = new AudioContextCtor();
    }
    return sharedAudioContext;
};

const disconnectNodes = (...nodes: AudioNode[]) => {
    for (const node of nodes) {
        try {
            node.disconnect();
        } catch {
            // 节点可能已断开
        }
    }
};

// 简单的振荡器蜂鸣声（复用单例 AudioContext）
const playBeep = async (vol: number = 0.5, type: BeepType = "tick") => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // autoplay 策略下可能处于 suspended，需在用户手势后的调用链中 resume
    if (ctx.state === "suspended") {
        try {
            await ctx.resume();
        } catch {
            return;
        }
    }

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
            disconnectNodes(osc, gain);
        };

        const now = ctx.currentTime;

        if (type === "start") {
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(
                1200,
                now + SOUND_START_RAMP,
            );
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(
                0.01,
                now + SOUND_START_DURATION,
            );
            osc.start(now);
            osc.stop(now + SOUND_START_DURATION);
        } else if (type === "end") {
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(
                300,
                now + SOUND_END_DURATION,
            );
            // 双重蜂鸣
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(
                0.01,
                now + SOUND_END_DURATION,
            );
            osc.start(now);
            osc.stop(now + SOUND_END_DURATION);
        } else {
            // 滴答声
            osc.frequency.setValueAtTime(1000, now);
            gain.gain.setValueAtTime(vol * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + SOUND_TICK_DURATION,
            );
            osc.start(now);
            osc.stop(now + SOUND_TICK_DURATION);
        }
    } catch {
        // 节点创建/调度失败时静默跳过，避免 fire-and-forget 产生未处理 rejection
    }
};

export const useSound = (enabled: boolean, volume: number) => {
    return useCallback(
        (type: BeepType) => {
            if (enabled) {
                void playBeep(volume, type);
            }
        },
        [enabled, volume],
    );
};
