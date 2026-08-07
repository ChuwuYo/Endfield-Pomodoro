import React from "react";
import mikuCharImg from "../../assets/images/MIKU1.webp";
import mikuLogoImg from "../../assets/images/MIKULogo.svg";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ThemePreset } from "../../types";

// ========== 背景效果组件 ==========

// 六边形网格背景 - 支持鼠标位置高亮

// 六边形平铺周期（pattern 40x69.28 经 patternTransform scale(0.5) 后的实际尺寸）
const HEX_TILE_W = 20;
const HEX_TILE_H = 34.64;
// 高亮窗口半径（与外层 mask 容器 360px 对应）
const HEX_SPOT_RADIUS = 180;

/**
 * 高亮层平铺贴图（data-URL SVG）。
 * 与原"全视口内嵌 SVG"实现完全一致：同一 pattern 定义、同一 stroke、
 * 同一三层 feDropShadow 辉光；滤镜作用于 3x3 平铺范围（邻域辉光完整），
 * 再由 SVG 视口裁剪出单个周期，平铺后与原先的无限平面逐像素一致。
 * data-URL 中无法使用 CSS 变量，颜色直接取 MIKU 主题的 --color-highlight (#fdd1ff)。
 *
 * 性能：原先内层是 100vw x 100vh 的 SVG + 滤镜 + mask，主题切换的 500ms
 * 颜色过渡期间每帧都被迫重栅格化这个全视口滤镜表面（实测约 500ms 主线程
 * 光栅开销）。改为小贴图平铺后，栅格化面积从视口级降到单个 20x34.64 周期。
 */
const hexHighlightTileUrl = (() => {
    const color = "#fdd1ff";
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${HEX_TILE_W}' height='${HEX_TILE_H}' viewBox='0 0 ${HEX_TILE_W} ${HEX_TILE_H}'>` +
        `<defs>` +
        `<pattern id='p' width='40' height='69.28' patternUnits='userSpaceOnUse' patternTransform='scale(0.5)'>` +
        `<path d='M20 0L40 11.54L40 34.64L20 46.18L0 34.64L0 11.54Z' fill='none' stroke='${color}' stroke-width='2'/>` +
        `</pattern>` +
        `<filter id='g' x='-50%' y='-50%' width='200%' height='200%'>` +
        `<feDropShadow dx='0' dy='0' stdDeviation='2' flood-color='${color}' flood-opacity='0.8'/>` +
        `<feDropShadow dx='0' dy='0' stdDeviation='4' flood-color='${color}' flood-opacity='0.4'/>` +
        `<feDropShadow dx='0' dy='0' stdDeviation='6' flood-color='${color}' flood-opacity='0.2'/>` +
        `</filter>` +
        `</defs>` +
        `<rect x='-40' y='-69.28' width='100' height='173.2' fill='url(#p)' filter='url(#g)'/>` +
        `</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

// 非负取模（JS % 对负数返回负值）
const mod = (n: number, m: number) => ((n % m) + m) % m;

const MikuHexPattern: React.FC = () => {
    const isMobile = useIsMobile();
    const outerRef = React.useRef<HTMLDivElement>(null);
    const innerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isMobile) return;

        // 同步直写 transform：浏览器按帧节奏合并派发 mousemove，
        // 经 rAF 转发可能多等一帧，表现为光标跟随延迟
        const handleMouseMove = (e: MouseEvent) => {
            if (outerRef.current && innerRef.current) {
                const x = e.clientX - HEX_SPOT_RADIUS;
                const y = e.clientY - HEX_SPOT_RADIUS;
                outerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                // 内层贴图按周期平铺，只需反相偏移一个周期内的余量即可
                // 与基础网格（锚定视口原点）保持对齐，视觉等同原先的全视口反向平移
                innerRef.current.style.transform = `translate3d(${-mod(x, HEX_TILE_W)}px, ${-mod(y, HEX_TILE_H)}px, 0)`;
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
                        width: `${HEX_SPOT_RADIUS * 2}px`,
                        height: `${HEX_SPOT_RADIUS * 2}px`,
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
                        className="absolute pointer-events-none"
                        style={{
                            // 各向外扩一个周期，保证余量偏移时窗口内始终被贴图覆盖
                            left: `${-HEX_TILE_W}px`,
                            top: `${-HEX_TILE_H}px`,
                            width: `${HEX_SPOT_RADIUS * 2 + HEX_TILE_W * 2}px`,
                            height: `${HEX_SPOT_RADIUS * 2 + HEX_TILE_H * 2}px`,
                            backgroundImage: hexHighlightTileUrl,
                            backgroundSize: `${HEX_TILE_W}px ${HEX_TILE_H}px`,
                            backgroundRepeat: "repeat",
                            transform: "translate3d(0px, 0px, 0)",
                            willChange: "transform",
                        }}
                    />
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
