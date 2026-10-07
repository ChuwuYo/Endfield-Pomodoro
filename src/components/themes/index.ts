/**
 * 主题 barrel：只做导出。
 *
 * 文件夹约定：
 *   themes/<preset>/index.ts      —— import 私有 css + 重导出背景/前景组件
 *   themes/<preset>/<Name>.tsx    —— 背景 / 前景组件
 *   themes/<preset>/<preset>.css  —— 私有样式，全包在 html[data-theme="<PRESET>"] 下
 */

export { AbyssalGrid } from "./abyssal";
export { AzureForeground, AzureGrid } from "./azure";
export { MatrixRain, NeonGrid, TacticalGrid } from "./BackgroundEffects";
export { TacticalForeground } from "./ForegroundEffects";
export { IndustrialForeground, IndustrialGrid } from "./industrial";
export { MikuBackgroundLayer, MikuDecorations } from "./miku";
export { OriginForeground, OriginGrid } from "./origin";
