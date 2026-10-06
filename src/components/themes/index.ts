/**
 * 主题 barrel：只做导出，不放样式、不放实现。
 *
 * 文件夹约定（ORIGIN 已落地，其余主题轮到时逐个搬，一次只动一个主题）：
 *   themes/<preset>/index.ts      —— import 私有 css + 重导出背景/前景组件
 *   themes/<preset>/<Name>.tsx    —— 背景 / 前景组件（保持原导出名，调用方不动）
 *   themes/<preset>/<preset>.css  —— 主题私有样式，全包在 html[data-theme="<PRESET>"] 下
 * 未迁移的主题暂留 BackgroundEffects.tsx / ForegroundEffects.tsx。
 */

export { AbyssalGrid } from "./abyssal";
export {
    AzureGrid,
    MatrixRain,
    NeonGrid,
    TacticalGrid,
} from "./BackgroundEffects";
export {
    AzureForeground,
    TacticalForeground,
} from "./ForegroundEffects";
export { IndustrialForeground, IndustrialGrid } from "./industrial";
export { MikuBackgroundLayer, MikuDecorations } from "./miku";
export { OriginForeground, OriginGrid } from "./origin";
