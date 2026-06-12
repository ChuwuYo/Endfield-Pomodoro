import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat["recommended-latest"],
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
    },
    {
        // useOnlinePlayer 将 HTMLAudioElement 存于 state（实例交换 Swap 需触发重渲染），
        // 并在 Effect/事件回调中直接修改音频对象属性，与 React Compiler 的不可变性
        // 模型冲突；编译器会自动跳过该 hook（已加 "use no memo" 显式声明，运行时无影响）。
        // 重构为 ref + 版本号 state 后可移除本豁免。
        files: ["src/hooks/useOnlinePlayer.ts"],
        rules: {
            "react-hooks/immutability": "off",
        },
    },
]);
