export interface MediaSessionTrackInfo {
    title: string;
    artist?: string;
    album?: string;
    cover?: string;
}

export interface MediaSessionPosition {
    duration: number;
    position: number;
    playbackRate?: number;
}

const COVER_SIZES = [512, 384, 256, 192, 128, 96];

const FALLBACK_ARTWORK: ReadonlyArray<{ file: string; sizes: string }> = [
    { file: "pwa-512x512.png", sizes: "512x512" },
    { file: "pwa-192x192.png", sizes: "192x192" },
    { file: "apple-touch-icon-180x180.png", sizes: "180x180" },
];

type AudioSessionType =
    | "auto"
    | "playback"
    | "transient"
    | "transient-solo"
    | "ambient"
    | "play-and-record";

type NavigatorWithAudioSession = Navigator & {
    audioSession?: { type: AudioSessionType };
};

export const isMediaSessionSupported = (): boolean =>
    typeof navigator !== "undefined" && "mediaSession" in navigator;

/**
 * 是否为 iOS / iPadOS 设备
 *
 * iPadOS 13+ 的 UA 与桌面 Safari 相同，通过 Macintosh + 多点触控识别。
 */
export const isAppleMobileDevice = (): boolean => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
};

/**
 * 需要注册的系统媒体操作
 *
 * iOS 锁屏只显示快退/快进或上一首/下一首其中一组，
 * 因此 iOS 上不注册 seekbackward/seekforward，以显示上一首/下一首。
 */
export const getSupportedMediaSessionActions = (): MediaSessionAction[] => {
    const actions: MediaSessionAction[] = [
        "play",
        "pause",
        "stop",
        "previoustrack",
        "nexttrack",
        "seekto",
    ];
    if (!isAppleMobileDevice()) {
        actions.push("seekbackward", "seekforward");
    }
    return actions;
};

export const setMediaSessionActionHandler = (
    action: MediaSessionAction,
    handler: MediaSessionActionHandler | null,
): boolean => {
    if (!isMediaSessionSupported()) return false;
    try {
        navigator.mediaSession.setActionHandler(action, handler);
        return true;
    } catch {
        return false;
    }
};

const isSecureArtworkSrc = (src: string): boolean => {
    try {
        const url = new URL(src, window.location.href);
        return (
            url.protocol === "https:" ||
            url.protocol === "blob:" ||
            url.protocol === "data:" ||
            url.origin === window.location.origin
        );
    } catch {
        return false;
    }
};

export const buildMediaSessionArtwork = (cover?: string): MediaImage[] => {
    if (cover && isSecureArtworkSrc(cover)) {
        return COVER_SIZES.map((size) => ({
            src: cover,
            sizes: `${size}x${size}`,
        }));
    }
    const base = import.meta.env.BASE_URL || "/";
    return FALLBACK_ARTWORK.map(({ file, sizes }) => ({
        src: `${base}${file}`,
        sizes,
        type: "image/png",
    }));
};

export const setMediaSessionMetadata = (
    track: MediaSessionTrackInfo | null,
): void => {
    if (!isMediaSessionSupported()) return;
    const session = navigator.mediaSession;
    try {
        if (!track) {
            session.metadata = null;
            return;
        }
        if (typeof MediaMetadata === "undefined") return;
        const artist = track.artist ?? "";
        const album = track.album ?? "";
        const current = session.metadata;
        const artwork = buildMediaSessionArtwork(track.cover);
        if (
            current &&
            current.title === track.title &&
            current.artist === artist &&
            current.album === album &&
            current.artwork[0]?.src === artwork[0]?.src
        ) {
            return;
        }
        session.metadata = new MediaMetadata({
            title: track.title,
            artist,
            album,
            artwork,
        });
    } catch {
        void 0;
    }
};

export const setMediaSessionPlaybackState = (
    state: MediaSessionPlaybackState,
): void => {
    if (!isMediaSessionSupported()) return;
    try {
        navigator.mediaSession.playbackState = state;
    } catch {
        void 0;
    }
};

export const setMediaSessionPositionState = (
    position: MediaSessionPosition | null,
): boolean => {
    if (!isMediaSessionSupported()) return false;
    const session = navigator.mediaSession;
    if (!("setPositionState" in session)) return false;
    try {
        if (
            !position ||
            !Number.isFinite(position.duration) ||
            position.duration <= 0
        ) {
            session.setPositionState();
            return false;
        }
        const safePosition = Number.isFinite(position.position)
            ? Math.min(Math.max(0, position.position), position.duration)
            : 0;
        session.setPositionState({
            duration: position.duration,
            playbackRate: position.playbackRate || 1,
            position: safePosition,
        });
        return true;
    } catch {
        return false;
    }
};

/** 将系统音频会话设为媒体播放类型（Safari 支持） */
export const setPlaybackAudioSession = (): void => {
    if (typeof navigator === "undefined") return;
    const audioSession = (navigator as NavigatorWithAudioSession).audioSession;
    if (!audioSession) return;
    try {
        audioSession.type = "playback";
    } catch {
        void 0;
    }
};
