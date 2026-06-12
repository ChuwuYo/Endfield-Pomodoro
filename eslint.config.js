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
        rules: {
            // eslint-plugin-react-hooks 7.1 新增的 React Compiler 规则，
            // 存量代码有 18 处违规，暂降为 warn，增量修复后恢复 error
            "react-hooks/immutability": "warn",
            "react-hooks/purity": "warn",
            "react-hooks/refs": "warn",
            "react-hooks/set-state-in-effect": "warn",
        },
    },
]);
