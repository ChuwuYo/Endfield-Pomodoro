import { STORAGE_KEYS } from "../constants";
import { ThemePreset } from "../types";
import { DEFAULT_THEME, THEME_MODES, THEMES } from "./themes";

/**
 * 首帧前执行的内联脚本：读取已存设置，把 data-theme / CSS 变量 / color-scheme
 * 写到 <html>，避免挂载前先闪默认主题。由 vite.config.ts 注入 index.html。
 */
export const buildThemeBootstrapScript = (): string => {
    const config = {
        key: STORAGE_KEYS.SETTINGS,
        fallback: DEFAULT_THEME,
        legacy: { LABORATORY: ThemePreset.AZURE },
        themes: THEMES,
        modes: THEME_MODES,
    };
    return `(function(){try{var c=${JSON.stringify(config)},d=document.documentElement,s=null;try{s=JSON.parse(localStorage.getItem(c.key)||"null")}catch(e){}var t=s&&typeof s==="object"?s.theme:null;if(c.legacy[t])t=c.legacy[t];if(!Object.prototype.hasOwnProperty.call(c.themes,t))t=c.fallback;var v=c.themes[t];d.dataset.theme=t;for(var k in v)d.style.setProperty(k,v[k]);d.style.colorScheme=c.modes[t]==="DARK"?"dark":"light"}catch(e){}})();`;
};
