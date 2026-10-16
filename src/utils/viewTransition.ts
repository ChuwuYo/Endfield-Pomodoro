import { flushSync } from "react-dom";

export type ViewTransitionKind = "theme" | "view";

type ViewTransitionLike = { finished: Promise<void> };
type DocumentWithViewTransition = Document & {
    startViewTransition?: (update: () => void) => ViewTransitionLike;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const prefersReducedMotion = (): boolean =>
    typeof window.matchMedia === "function" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** 临时禁用全部 CSS transition，返回恢复函数。 */
export const suppressTransitions = (): (() => void) => {
    const style = document.createElement("style");
    style.textContent =
        "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}";
    document.head.appendChild(style);
    return () => {
        void window.getComputedStyle(document.body).opacity;
        window.setTimeout(() => style.remove(), 1);
    };
};

let activeToken = 0;

/**
 * 以整页 View Transition 交叉淡入执行状态更新。
 * theme：过渡期间禁用逐元素 transition，由快照统一淡入；
 * 减弱动态效果或不支持 View Transition 时保持原有行为。
 */
export const runViewTransition = (
    update: () => void,
    kind: ViewTransitionKind,
): void => {
    if (prefersReducedMotion()) {
        update();
        return;
    }

    const doc = document as DocumentWithViewTransition;
    if (typeof doc.startViewTransition !== "function") {
        update();
        return;
    }

    const root = document.documentElement;
    const token = ++activeToken;
    root.dataset.vt = kind;
    const restore = kind === "theme" ? suppressTransitions() : null;
    const cleanup = () => {
        restore?.();
        if (token === activeToken) delete root.dataset.vt;
    };

    try {
        const transition = doc.startViewTransition(() => {
            flushSync(update);
        });
        transition.finished.then(cleanup, cleanup);
    } catch {
        cleanup();
        update();
    }
};
