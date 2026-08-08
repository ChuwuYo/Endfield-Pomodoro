/**
 * 音乐配置接口
 * 用于在线音乐播放器的配置
 */
export interface MusicConfig {
    server: "netease" | "tencent" | "kugou" | "baidu" | "kuwo";
    type: "playlist";
    id: string;
}

/**
 * 音乐数据源的唯一标识
 *
 * 同时用于：
 * - useMusicData：数据源变化时重置适配器起始索引
 * - AudioPlayer：作为 MusicPlayer 的 key，换歌单时重置播放器全部内部状态
 */
export const musicSourceKey = ({
    server,
    type,
    id,
}: {
    server: string;
    type: string;
    id: string;
}): string => `${server}|${type}|${id}`;

/**
 * 默认音乐配置
 * 用于 App.tsx 中的 DEFAULT_SETTINGS
 */
export const defaultMusicConfig: MusicConfig = {
    server: "netease", // 音乐平台：网易云
    type: "playlist", // 类型：歌单
    id: "9094583817", // 默认歌单ID
};

/**
 * 音乐播放器默认音量
 * 范围：0.0 - 1.0
 */
export const DEFAULT_MUSIC_VOLUME = 0.5;
