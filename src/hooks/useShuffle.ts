import { useCallback, useEffect, useState } from "react";
import { PlayMode } from "../types";

export const useShuffle = (
    playlistLength: number,
    playMode: PlayMode,
    currentIndex: number,
) => {
    const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
    const shufflePointer = shuffledIndices.indexOf(currentIndex);

    useEffect(() => {
        if (playMode === PlayMode.RANDOM && playlistLength > 0) {
            const indices = Array.from({ length: playlistLength }, (_, i) => i);

            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }

            queueMicrotask(() => setShuffledIndices(indices));
        } else {
            queueMicrotask(() => setShuffledIndices([]));
        }
    }, [playlistLength, playMode]);

    const getNextRandomIndex = useCallback((): number => {
        if (playlistLength === 0) return -1;

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

        if (nextPointer >= shuffledIndices.length) {
            const newIndices = [...shuffledIndices];

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
            return shuffledIndices[nextPointer];
        }
    }, [playlistLength, shuffledIndices, shufflePointer, currentIndex]);

    const getPrevRandomIndex = useCallback((): number => {
        if (playlistLength === 0) return -1;

        if (shuffledIndices.length > 0) {
            let prevPointer = shufflePointer - 1;

            if (prevPointer < 0) {
                prevPointer = shuffledIndices.length - 1;
            }

            return shuffledIndices[prevPointer];
        } else {
            let prevIndex;
            do {
                prevIndex = Math.floor(Math.random() * playlistLength);
            } while (prevIndex === currentIndex && playlistLength > 1);
            return prevIndex;
        }
    }, [playlistLength, shuffledIndices, shufflePointer, currentIndex]);

    const peekNextRandomIndex = useCallback((): number => {
        if (playlistLength === 0) return -1;

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
