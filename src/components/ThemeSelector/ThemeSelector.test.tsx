import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Language, ThemePreset } from "../../types";
// useTranslation 是纯函数（非 Hook），别名避开 react-hooks 误报
import { useTranslation as createTranslator } from "../../utils/i18n";
import { ThemeSelector } from "./index";

// jsdom 未实现 scrollIntoView，CustomSelect 展开下拉时会调用
Element.prototype.scrollIntoView = vi.fn();

const t = createTranslator(Language.EN);

const setup = (theme: ThemePreset = ThemePreset.AZURE) => {
    const onThemeChange = vi.fn();
    render(<ThemeSelector theme={theme} onThemeChange={onThemeChange} t={t} />);
    return { onThemeChange };
};

describe("ThemeSelector", () => {
    it("marks the current mode tab pressed", () => {
        setup(ThemePreset.AZURE);
        expect(
            screen
                .getByRole("button", { name: "LIGHT" })
                .getAttribute("aria-pressed"),
        ).toBe("true");
        expect(
            screen
                .getByRole("button", { name: "DARK" })
                .getAttribute("aria-pressed"),
        ).toBe("false");
    });

    it("switching mode only filters, never changes the theme", () => {
        const { onThemeChange } = setup(ThemePreset.AZURE);
        fireEvent.click(screen.getByRole("button", { name: "DARK" }));
        expect(onThemeChange).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("combobox"));
        expect(screen.getAllByRole("option")).toHaveLength(5);
    });

    it("current selection display is unaffected by the filter", () => {
        setup(ThemePreset.AZURE);
        fireEvent.click(screen.getByRole("button", { name: "DARK" }));
        // 显示本地化 label，而非 raw value "AZURE"
        expect(screen.getByRole("combobox")).toHaveTextContent("AZURE ARCHIVE");
        fireEvent.click(screen.getByRole("combobox"));
        expect(screen.getAllByRole("option")).toHaveLength(5);
    });

    it("dropdown lists only the current mode's themes", () => {
        setup(ThemePreset.AZURE);
        fireEvent.click(screen.getByRole("combobox"));
        expect(screen.getAllByRole("option")).toHaveLength(3);
    });

    it("picking an option applies that theme", () => {
        const { onThemeChange } = setup(ThemePreset.AZURE);
        fireEvent.click(screen.getByRole("combobox"));
        fireEvent.click(screen.getAllByRole("option")[0]);
        expect(onThemeChange).toHaveBeenCalledWith(ThemePreset.INDUSTRIAL);
    });
});
