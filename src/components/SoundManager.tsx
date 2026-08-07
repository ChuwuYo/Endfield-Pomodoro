import { useCallback } from "react";
import {
    SOUND_END_DURATION,
    SOUND_START_DURATION,
    SOUND_START_RAMP,
    SOUND_TICK_DURATION,
} from "../constants";

type BeepType = "start" | "end" | "tick";

/** autoplay 拦截下 resume() 可能永不 settle，超时后跳过本次蜂鸣 */
const AUDIO_CONTEXT_RESUME_TIMEOUT_MS = 200;

/** 模块级单例：避免每次蜂鸣 new AudioContext() 耗尽浏览器配额 */
let sharedAudioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof window.AudioContext })
            .webkitAudioContext;
    if (!AudioContextCtor) return null;

    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
        try {
            sharedAudioContext = new AudioContextCtor();
        } catch {
            return null;
        }
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

const resumeAudioContext = async (ctx: AudioContext): Promise<boolean> => {
    if (ctx.state !== "suspended") return true;
    try {
        await Promise.race([
            ctx.resume(),
            new Promise<never>((_, reject) => {
                window.setTimeout(
                    () => reject(new Error("AudioContext resume timeout")),
                    AUDIO_CONTEXT_RESUME_TIMEOUT_MS,
                );
            }),
        ]);
        // resume() resolve 即表示已恢复；勿再读 ctx.state（控制流仍收窄为 suspended）
        return true;
    } catch {
        return false;
    }
};

// 简单的振荡器蜂鸣声（复用单例 AudioContext）
const playBeep = async (vol: number = 0.5, type: BeepType = "tick") => {
    // exponentialRamp 要求正数起点；非正音量无法发出有效蜂鸣
    if (!(vol > 0)) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    // autoplay 策略下可能处于 suspended；超时则跳过，避免永久挂起
    if (!(await resumeAudioContext(ctx))) return;

    const createdNodes: AudioNode[] = [];
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        createdNodes.push(osc, gain);

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
        // 调度失败时 onended 不会触发，主动断开已连接节点
        disconnectNodes(...createdNodes);
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
