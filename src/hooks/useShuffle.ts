import { useCallback, useEffect, useState } from "react";
import { PlayMode } from "../types";

/**
 * 随机播放逻辑 Hook
 *
 * 1. 随机模式下无重复播放，直到列表全部播完
 * 2. 列表播完后自动重新洗牌
 * 3. 支持上一曲回退到正确的历史记录
 *
 * @param playlistLength 播放列表长度
 * @param playMode 当前播放模式
 * @param currentIndex 当前播放索引
 */
export const useShuffle = (
    playlistLength: number,
    playMode: PlayMode,
    currentIndex: number,
) => {
    // 存储打乱后的索引列表
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
    // 当前播放指针在 shuffledIndices 中的位置
    const shufflePointer = shuffledIndices.indexOf(currentIndex);

    // 当播放列表变化或切换到随机模式时，初始化洗牌
    useEffect(() => {
        if (playMode === PlayMode.RANDOM && playlistLength > 0) {
            // 生成初始索引数组 [0, 1, 2, ...]
            const indices = Array.from({ length: playlistLength }, (_, i) => i);

            // Fisher-Yates 洗牌算法
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            // 使用 queueMicrotask 避免在 effect 中同步 setState 导致的警告
            queueMicrotask(() => setShuffledIndices(indices));
        } else {
            // 非随机模式，清空状态
            queueMicrotask(() => setShuffledIndices([]));
        }
    }, [playlistLength, playMode]);

    /**
     * 获取下一首随机歌曲的索引
     */
    const getNextRandomIndex = useCallback((): number => {
        if (playlistLength === 0) return -1;

        // 如果洗牌列表未准备好（极端情况），降级为纯随机
        if (shuffledIndices.length === 0) {
            if (playlistLength <= 1) {
                return 0;
            }
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * playlistLength);
            } while (nextIndex === currentIndex);
            return nextIndex;
        }

        const nextPointer = shufflePointer + 1;

        // 如果已经播完了整个列表，需要重新洗牌
        if (nextPointer >= shuffledIndices.length) {
            const newIndices = [...shuffledIndices];

            // 重新洗牌
            for (let i = newIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newIndices[i], newIndices[j]] = [newIndices[j], newIndices[i]];
            }

            // 避免首尾相接：如果新列表的第一首跟旧列表的最后一首一样，交换第一首和第二首
            if (
                newIndices.length > 1 &&
                newIndices[0] === shuffledIndices[shuffledIndices.length - 1]
            ) {
                [newIndices[0], newIndices[1]] = [newIndices[1], newIndices[0]];
            }

            setShuffledIndices(newIndices);
            return newIndices[0];
        } else {
            // 正常移动指针
            return shuffledIndices[nextPointer];
        }
    }, [playlistLength, shuffledIndices, shufflePointer, currentIndex]);

    /**
     * 获取上一首随机歌曲的索引
     */
    const getPrevRandomIndex = useCallback((): number => {
        if (playlistLength === 0) return -1;

        if (shuffledIndices.length > 0) {
            let prevPointer = shufflePointer - 1;

            // 如果已经是第一首，回退到最后一首（循环）
            if (prevPointer < 0) {
                prevPointer = shuffledIndices.length - 1;
            }

            // 直接返回对应的 index
            return shuffledIndices[prevPointer];
        } else {
            // 降级策略：纯随机，但尽量不重复当前
            let prevIndex;
            do {
                prevIndex = Math.floor(Math.random() * playlistLength);
            } while (prevIndex === currentIndex && playlistLength > 1);
            return prevIndex;
        }
    }, [playlistLength, shuffledIndices, shufflePointer, currentIndex]);

    /**
     * 预览下一首随机歌曲的索引（不改变状态）
     * 用于预加载
     */
    const peekNextRandomIndex = useCallback((): number => {
        if (playlistLength === 0) return -1;

        // 如果洗牌列表未准备好
        if (shuffledIndices.length === 0) return -1;

        const nextPointer = shufflePointer + 1;

        // 如果即将重新洗牌，无法预测下一首（返回 -1 表示不预加载）
        if (nextPointer >= shuffledIndices.length) {
            return -1;
        }

        return shuffledIndices[nextPointer];
    }, [playlistLength, shuffledIndices, shufflePointer]);

    return {
        getNextRandomIndex,
        getPrevRandomIndex,
        peekNextRandomIndex,
    };
};
