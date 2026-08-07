import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary, ErrorFallback } from "./ErrorBoundary";

const ThrowingChild = ({ message }: { message: string }) => {
    throw new Error(message);
};

describe("ErrorBoundary", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("renders children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <div>ok</div>
            </ErrorBoundary>,
        );
        expect(screen.getByText("ok")).toBeInTheDocument();
    });

    it("shows fallback UI when a child throws during render", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ThrowingChild message="boom" />
            </ErrorBoundary>,
        );

        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: /刷新页面|RELOAD/i,
            }),
        ).toBeInTheDocument();
    });
});

describe("ErrorFallback", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        document.documentElement.lang = "zh-CN";
    });

    it("calls onReload when the reload button is pressed", () => {
        const onReload = vi.fn();
        document.documentElement.lang = "zh-CN";

        render(<ErrorFallback onReload={onReload} />);
        fireEvent.click(screen.getByRole("button", { name: "刷新页面" }));
        expect(onReload).toHaveBeenCalledTimes(1);
    });
});
