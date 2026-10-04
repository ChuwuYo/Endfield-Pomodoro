import { describe, expect, it } from "vitest";
import { Language } from "../types";
import { loadCjkFontCss } from "./cjkFont";

describe("loadCjkFontCss", () => {
    it("英文没有 CJK 字族要加载，也不该产生请求", async () => {
        await expect(loadCjkFontCss(Language.EN)).resolves.toBeUndefined();
    });

    it.each([Language.CN, Language.TW, Language.JA, Language.KO])(
        "%s 都能加载到对应的 CJK 字族 CSS",
        async (language) => {
            await expect(loadCjkFontCss(language)).resolves.not.toThrow();
        },
    );

    it("覆盖全部 CJK 语言：新增语言时若漏掉字族映射会失败", () => {
        const cjkLanguages = Object.values(Language).filter(
            (language) => language !== Language.EN,
        );
        expect(cjkLanguages).toHaveLength(4);
    });
});
