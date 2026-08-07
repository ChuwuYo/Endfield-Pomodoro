import React, { useEffect, useId, useRef, useState } from "react";

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    className?: string;
    id?: string;
    "aria-labelledby"?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    options,
    onChange,
    className = "",
    id,
    "aria-labelledby": ariaLabelledBy,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const listboxId = useId();
    const optionId = (index: number) => `${listboxId}-option-${index}`;

    const selectedOption = options.find((opt) => opt.value === value);
    const selectedIndex = Math.max(
        0,
        options.findIndex((opt) => opt.value === value),
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const openList = () => {
        setActiveIndex(selectedIndex);
        setIsOpen(true);
    };

    const commit = (index: number) => {
        const option = options[index];
        if (!option) return;
        onChange(option.value);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;
        document
            .getElementById(`${listboxId}-option-${activeIndex}`)
            ?.scrollIntoView({
                block: "nearest",
            });
    }, [isOpen, activeIndex, listboxId]);

    const onTriggerKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!isOpen) {
                openList();
                return;
            }
            setActiveIndex((prev) => {
                if (e.key === "ArrowDown") {
                    return (prev + 1) % options.length;
                }
                return (prev - 1 + options.length) % options.length;
            });
            return;
        }
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (isOpen) {
                commit(activeIndex);
            } else {
                openList();
            }
            return;
        }
        if (e.key === "Escape") {
            if (isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
            return;
        }
        if (e.key === "Home" && isOpen) {
            e.preventDefault();
            setActiveIndex(0);
            return;
        }
        if (e.key === "End" && isOpen) {
            e.preventDefault();
            setActiveIndex(Math.max(0, options.length - 1));
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <button
                type="button"
                id={id}
                onClick={() => {
                    if (isOpen) {
                        setIsOpen(false);
                    } else {
                        openList();
                    }
                }}
                onKeyDown={onTriggerKeyDown}
                onBlur={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (
                        isOpen &&
                        next &&
                        containerRef.current?.contains(next)
                    ) {
                        return;
                    }
                    if (isOpen) setIsOpen(false);
                }}
                title={selectedOption?.label || value}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                aria-activedescendant={
                    isOpen ? optionId(activeIndex) : undefined
                }
                aria-labelledby={ariaLabelledBy}
                className="w-full bg-theme-highlight/20 border border-theme-highlight text-theme-text font-ui-mono text-ui-sm leading-ui-none px-4 h-form-control focus:outline-none focus:border-theme-primary hover:bg-theme-highlight/10 transition-all duration-300 flex items-center justify-between group cursor-pointer"
            >
                <span className="truncate">
                    {selectedOption?.label || value}
                </span>
                <i
                    className={`ri-arrow-down-s-line icon-ui-lg transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                ></i>
            </button>

            {isOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    className="absolute top-full left-0 right-0 mt-1 bg-theme-surface border border-theme-primary shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 max-h-64 overflow-y-auto custom-scrollbar"
                >
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            id={optionId(index)}
                            role="option"
                            aria-selected={option.value === value}
                            tabIndex={-1}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => commit(index)}
                            className={`w-full text-left px-4 min-h-form-control font-ui-mono text-ui-sm leading-ui-none transition-all duration-200 border-b border-theme-highlight/30 border-l-2 last:border-b-0 cursor-pointer ${
                                index === activeIndex
                                    ? "bg-theme-primary/20 text-theme-primary border-l-theme-primary"
                                    : option.value === value
                                      ? "bg-theme-primary/10 text-theme-primary border-l-theme-primary/60"
                                      : "text-theme-text border-l-transparent hover:bg-theme-highlight/20 hover:text-theme-primary hover:border-l-theme-primary"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="truncate">{option.label}</span>
                                {option.value === value && (
                                    <i
                                        className="ri-check-line icon-ui-md"
                                        aria-hidden="true"
                                    ></i>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
