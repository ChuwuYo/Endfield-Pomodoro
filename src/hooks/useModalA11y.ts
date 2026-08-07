import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 模态层无障碍：Escape 关闭、焦点陷阱、打开时锁定 body 滚动并还原焦点。
 */
export const useModalA11y = (
    open: boolean,
    onClose: () => void,
    containerRef: React.RefObject<HTMLElement | null>,
) => {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const container = containerRef.current;
        const focusables = () =>
            container
                ? Array.from(
                      container.querySelectorAll<HTMLElement>(
                          FOCUSABLE_SELECTOR,
                      ),
                  ).filter(
                      (el) =>
                          !el.hasAttribute("disabled") &&
                          el.getAttribute("aria-hidden") !== "true",
                  )
                : [];

        const initial = focusables();
        (initial[0] ?? container)?.focus?.();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== "Tab" || !container) return;

            const items = focusables();
            if (items.length === 0) {
                e.preventDefault();
                container.focus();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            const activeInside =
                active instanceof Node && container.contains(active);

            // 删除当前聚焦项后焦点可能落到 body，Tab 会逃出模态
            if (!activeInside) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
                return;
            }

            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
            previousFocusRef.current?.focus?.();
        };
    }, [open, onClose, containerRef]);
};
