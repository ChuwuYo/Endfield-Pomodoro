import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

const setup = (props: Record<string, unknown> = {}) => {
    const onStep = vi.fn();
    render(
        <Input
            type="number"
            min={1}
            value={25}
            onChange={() => {}}
            onStep={onStep}
            {...props}
        />,
    );
    // 顺序与 DOM 一致：先减后加
    const [decrement, increment] = document.querySelectorAll("button");
    return { onStep, decrement, increment };
};

describe("Input 增减按钮", () => {
    it("点下三角回调 -1，点上三角回调 +1", () => {
        const { onStep, decrement, increment } = setup();
        fireEvent.click(decrement);
        fireEvent.click(increment);
        expect(onStep.mock.calls).toEqual([[-1], [1]]);
    });

    it("到 min 时禁用减号且不触发回调", () => {
        const { onStep, decrement } = setup({ value: 1 });
        expect(decrement).toBeDisabled();
        fireEvent.click(decrement);
        expect(onStep).not.toHaveBeenCalled();
    });

    it("到 max 时禁用加号", () => {
        const { increment } = setup({ max: 25 });
        expect(increment).toBeDisabled();
    });

    it("按钮不进 tab 序：键盘加减交给 input 的方向键", () => {
        const { decrement, increment } = setup();
        expect(decrement.getAttribute("tabindex")).toBe("-1");
        expect(increment.getAttribute("tabindex")).toBe("-1");
    });

    it("没传 onStep 时不渲染按钮", () => {
        render(<Input type="number" min={1} value={25} readOnly />);
        expect(document.querySelectorAll("button")).toHaveLength(0);
    });
});
