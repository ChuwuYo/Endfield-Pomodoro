export interface MusicConfig {
    server: "netease" | "tencent" | "kugou" | "baidu" | "kuwo";
    type: "playlist";
    id: string;
}

export const musicSourceKey = ({
    server,
    type,
    id,
}: {
    server: string;
    type: string;
    id: string;
}): string => `${server}|${type}|${id}`;

export const defaultMusicConfig: MusicConfig = {
    server: "netease",
    type: "playlist",
    id: "9094583817",
};

export const DEFAULT_MUSIC_VOLUME = 0.5;
