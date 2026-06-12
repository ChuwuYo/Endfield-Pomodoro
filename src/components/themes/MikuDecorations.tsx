import React from "react";
import mikuCharImg from "../../assets/images/MIKU1.webp";
import mikuLogoImg from "../../assets/images/MIKULogo.svg";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ThemePreset } from "../../types";

// ========== 背景效果组件 ==========

// 六边形网格背景 - 支持鼠标位置高亮
const MikuHexPattern: React.FC = () => {
    const isMobile = useIsMobile();
    const outerRef = React.useRef<HTMLDivElement>(null);
    const innerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isMobile) return;

        const radius = 180;

        // 同步直写 transform：浏览器按帧节奏合并派发 mousemove，
        // 经 rAF 转发可能多等一帧，表现为光标跟随延迟
        const handleMouseMove = (e: MouseEvent) => {
            if (outerRef.current && innerRef.current) {
                const x = e.clientX - radius;
                const y = e.clientY - radius;
                outerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                innerRef.current.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isMobile]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* 基础六角形网格 - primary color */}
            <svg
                width="100%"
                height="100%"
                className="absolute inset-0 opacity-[0.15]"
            >
                <defs>
                    <pattern
                        id="hex-grid-base"
                        width="40"
                        height="69.28"
                        patternUnits="userSpaceOnUse"
                        patternTransform="scale(0.5)"
                    >
                        <path
                            d="M20 0L40 11.54L40 34.64L20 46.18L0 34.64L0 11.54Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="url(#hex-grid-base)"
                    style={{ color: "var(--color-primary)" }}
                />
            </svg>

            {/* 鼠标位置高亮六角形 - hardware accelerated spotlight */}
            {!isMobile && (
                <div
                    ref={outerRef}
                    className="absolute top-0 left-0 pointer-events-none"
                    style={{
                        width: "360px",
                        height: "360px",
                        transform: "translate3d(-1000px, -1000px, 0)",
                        willChange: "transform",
                        maskImage:
                            "radial-gradient(circle at center, white 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.3) 70%, transparent 100%)",
                        WebkitMaskImage:
                            "radial-gradient(circle at center, white 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.3) 70%, transparent 100%)",
                    }}
                >
                    <div
                        ref={innerRef}
                        className="absolute top-0 left-0"
                        style={{
                            width: "100vw",
                            height: "100vh",
                            transform: "translate3d(1000px, 1000px, 0)",
                            willChange: "transform",
                        }}
                    >
                        <svg
                            width="100%"
                            height="100%"
                            className="absolute inset-0"
                        >
                            <defs>
                                <pattern
                                    id="hex-grid-highlight"
                                    width="40"
                                    height="69.28"
                                    patternUnits="userSpaceOnUse"
                                    patternTransform="scale(0.5)"
                                >
                                    <path
                                        d="M20 0L40 11.54L40 34.64L20 46.18L0 34.64L0 11.54Z"
                                        fill="none"
                                        stroke="var(--color-highlight)"
                                        strokeWidth="2"
                                    />
                                </pattern>
                                {/* 线条发光滤镜 */}
                                <filter
                                    id="line-glow"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >
                                    <feDropShadow
                                        dx="0"
                                        dy="0"
                                        stdDeviation="2"
                                        floodColor="var(--color-highlight)"
                                        floodOpacity="0.8"
                                    />
                                    <feDropShadow
                                        dx="0"
                                        dy="0"
                                        stdDeviation="4"
                                        floodColor="var(--color-highlight)"
                                        floodOpacity="0.4"
                                    />
                                    <feDropShadow
                                        dx="0"
                                        dy="0"
                                        stdDeviation="6"
                                        floodColor="var(--color-highlight)"
                                        floodOpacity="0.2"
                                    />
                                </filter>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="url(#hex-grid-highlight)"
                                filter="url(#line-glow)"
                            />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

// Miku 频谱条动画
const MikuEqualizerBars = () => {
    const bars = Array.from({ length: 20 }, (_, i) => ({
        id: i,
    }));

    return (
        <>
            <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 opacity-20 pointer-events-none overflow-hidden px-10 pb-12">
                {bars.map((bar) => (
                    <div
                        key={bar.id}
                        className="w-4 rounded-t-sm animate-equalizer"
                        style={
                            {
                                backgroundColor: "var(--color-primary)",
                                "--bar-index": bar.id,
                            } as React.CSSProperties
                        }
                    />
                ))}
            </div>
            <style>{`
                @keyframes equalizer {
                    0% { transform: scaleY(0.16); opacity: 0.3; }
                    100% { transform: scaleY(1); opacity: 0.8; }
                }
                .animate-equalizer {
                    height: 60%;
                    transform-origin: bottom center;
                    animation: equalizer 1s infinite ease-in-out alternate;
                    animation-delay: calc(var(--bar-index) * -0.12s);
                }
            `}</style>
        </>
    );
};

// Miku 背景层容器 - 自带鼠标跟踪
export const MikuBackgroundLayer: React.FC = () => {
    return (
        <>
            <MikuHexPattern />
            <div
                className="absolute -top-20 -right-20 w-96 h-96 border border-theme-highlight rounded-full opacity-20 animate-spin-slow"
                style={{ borderStyle: "dashed", animationDuration: "60s" }}
            />
            <MikuEqualizerBars />
        </>
    );
};

// ========== 前景效果组件 ==========

// Miku 前景层效果
export const MikuForegroundLayer: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {/* 前景层现在为空 */}
        </div>
    );
};

// ========== 装饰元素组件 ==========

// Miku 角色图片装饰组件
const MikuCharacter: React.FC<{ footerHeight: number }> = ({
    footerHeight,
}) => {
    return (
        <div
            className="fixed left-1/2 -translate-x-1/2 z-[5] pointer-events-none"
            style={{ bottom: footerHeight }}
        >
            <img
                src={mikuCharImg}
                alt="Miku"
                className="w-24 h-24 md:w-36 md:h-36 object-contain opacity-90"
                draggable={false}
            />
        </div>
    );
};

// Miku Logo 装饰组件
const MikuLogo: React.FC<{ footerHeight: number }> = ({ footerHeight }) => {
    return (
        <div
            className="fixed right-4 md:right-8 z-[5] pointer-events-none"
            style={{ bottom: footerHeight }}
        >
            <img
                src={mikuLogoImg}
                alt="Miku Logo"
                className="w-10 h-10 md:w-16 md:h-16 opacity-80"
                draggable={false}
            />
        </div>
    );
};

// Miku 主题装饰层容器 - 自动处理主题检查
export const MikuDecorations: React.FC<{
    theme: ThemePreset;
    footerHeight: number;
}> = ({ theme, footerHeight }) => {
    // 只在 Miku 主题时渲染
    if (theme !== ThemePreset.MIKU) {
        return null;
    }

    return (
        <>
            <MikuCharacter footerHeight={footerHeight} />
            <MikuLogo footerHeight={footerHeight} />
        </>
    );
};
