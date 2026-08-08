import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../constants";
import { Language } from "../types";
import { ErrorBoundary, ErrorFallback } from "./ErrorBoundary";

const ThrowingChild = ({ message }: { message: string }) => {
    throw new Error(message);
};

describe("ErrorBoundary", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        window.localStorage.clear();
        document.documentElement.lang = "zh-CN";
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

    it("reloads the page from the boundary recovery button", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const reload = vi.fn();
        vi.stubGlobal("location", {
            reload,
            href: window.location.href,
            assign: vi.fn(),
            replace: vi.fn(),
        });

        render(
            <ErrorBoundary>
                <ThrowingChild message="boom" />
            </ErrorBoundary>,
        );

        fireEvent.click(
            screen.getByRole("button", { name: /刷新页面|RELOAD/i }),
        );
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it("moves focus to the reload button after crash", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <ThrowingChild message="boom" />
            </ErrorBoundary>,
        );
        expect(
            screen.getByRole("button", { name: /刷新页面|RELOAD/i }),
        ).toHaveFocus();
    });
});

describe("ErrorFallback", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        window.localStorage.clear();
        document.documentElement.lang = "zh-CN";
    });

    it("calls onReload when the reload button is pressed", () => {
        const onReload = vi.fn();
        document.documentElement.lang = "zh-CN";

        render(<ErrorFallback onReload={onReload} />);
        fireEvent.click(screen.getByRole("button", { name: "刷新页面" }));
        expect(onReload).toHaveBeenCalledTimes(1);
    });

    it("renders Chinese copy when html lang is zh-CN", () => {
        document.documentElement.lang = "zh-CN";
        render(<ErrorFallback onReload={() => {}} />);
        expect(
            screen.getByRole("button", { name: "刷新页面" }),
        ).toBeInTheDocument();
        expect(screen.getByText("系统异常")).toBeInTheDocument();
    });

    it("renders English copy when html lang is en", () => {
        document.documentElement.lang = "en";
        render(<ErrorFallback onReload={() => {}} />);
        expect(
            screen.getByRole("button", { name: "RELOAD" }),
        ).toBeInTheDocument();
        expect(screen.getByText("SYSTEM FAULT")).toBeInTheDocument();
    });

    it("renders English copy from persisted settings even if html lang is zh-CN", () => {
        window.localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify({ language: Language.EN }),
        );
        document.documentElement.lang = "zh-CN";

        render(<ErrorFallback onReload={() => {}} />);
        expect(
            screen.getByRole("button", { name: "RELOAD" }),
        ).toBeInTheDocument();
        expect(screen.getByText("SYSTEM FAULT")).toBeInTheDocument();
    });
});
