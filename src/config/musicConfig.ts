export interface AudioItem {
  name: string;
  artist: string;
  url: string;
  cover?: string;
  lrc?: string;
  theme?: string;
  album?: string;
  duration?: number;
  bitrate?: number;
}

export interface MetingConfig {
  server: 'netease' | 'tencent' | 'kugou' | 'xiami' | 'baidu';
  type: 'playlist';
  id: string;
  fixed?: boolean;
  mini?: boolean;
  autoplay?: boolean;
  theme?: string;
  loop?: 'all' | 'one' | 'none';
  order?: 'list' | 'random';
  preload?: 'none' | 'metadata' | 'auto';
  volume?: number;
  mutex?: boolean;
  listFolded?: boolean;
  listMaxHeight?: number;
  lrcType?: 0 | 1 | 2 | 3;
  audio?: AudioItem[];
  storageName?: string;
}

export const defaultMetingConfig: MetingConfig = {
  server: 'netease',      // 音乐平台：网易云
  type: 'playlist',       // 类型：歌单
  id: '9094583817',       // 用户歌单ID
  fixed: false,           // 不固定在页面底部
  mini: false,            // 非迷你模式
  autoplay: false,        // 不自动播放
  theme: '#ea580c',       // 主题色（匹配 ORIGIN 主题的 primary 色）
  loop: 'all',            // 循环播放全部
  order: 'list',          // 列表顺序播放
  preload: 'auto',        // 自动预加载
  volume: 0.7,            // 音量 70%
  mutex: true,            // 互斥（同时只能播放一个）
  listFolded: true,       // 列表默认折叠 (配合新的下拉样式)
  listMaxHeight: 240,     // 列表最大高度
  lrcType: 3,             // 歌词类型 0:关闭 1:显示 3:显示+支持动画
};
