/** 播放列表至少露出的曲目行数；下方不够则翻到上方打开 */
export const PLAYLIST_MIN_VISIBLE_ROWS = 5;

/** 单行曲目近似高度（设计稿 px：p-2 上下 + text-ui-xs） */
export const PLAYLIST_ROW_DESIGN_PX = 36;

/** 表头近似高度（设计稿 px） */
export const PLAYLIST_HEADER_DESIGN_PX = 40;

/** 含表头、至少 N 行曲目的最小面板高度（设计稿 px） */
export const PLAYLIST_MIN_HEIGHT_DESIGN_PX =
    PLAYLIST_HEADER_DESIGN_PX +
    PLAYLIST_MIN_VISIBLE_ROWS * PLAYLIST_ROW_DESIGN_PX;

/** 与原先 max-h-60 对齐的高度上限（设计稿 px） */
export const PLAYLIST_MAX_HEIGHT_CAP_DESIGN_PX = 240;

/** 定位完成后再显示，避免首帧停在 inset:auto 左上角 */
export const PLAYLIST_POSITIONED_CLASS = "is-positioned";
