/**
 * 在线播放列表 popover 节点是否已进入 DOM。
 * MusicPlayer 在 loading / error / 无曲目时 early-return，
 * toggle 监听必须等此条件为 true 后再绑，否则会停在默认左上角。
 */
export const isPlaylistPopoverMountReady = (
    loading: boolean,
    hasError: boolean,
    hasCurrentSong: boolean,
): boolean => !loading && !hasError && hasCurrentSong;
