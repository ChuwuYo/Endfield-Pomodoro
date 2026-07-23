import React from "react";
import { View } from "../types";
import { useTranslation } from "../utils/i18n";
import { Button } from "./ui";

type HeaderBarProps = {
    currentView: View;
    onViewChange: (view: View) => void;
    now: Date;
    isOnline: boolean;
    version: string;
    t: ReturnType<typeof useTranslation>;
};

const HeaderBar: React.FC<HeaderBarProps> = ({
    currentView,
    onViewChange,
    now,
    isOnline,
    version,
    t,
}) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 select-none border-b border-theme-highlight/30 bg-theme-base/80 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 max-w-[1920px] mx-auto">
                <div className="flex items-center gap-4 group cursor-default">
                    <div className="relative flex items-center">
                        <div className="w-1 h-10 bg-theme-primary" />
                        <div className="w-3 h-10 bg-theme-primary/20 ml-0.5" />
                        <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-theme-primary/50" />
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-ui-xl font-bold font-ui-sans tracking-ui-tight leading-ui-none text-theme-text uppercase flex items-center">
                                <span className="text-theme-dim font-normal mr-1">
                                    [
                                </span>
                                <span
                                    className="text-hover-fill"
                                    data-text="ENDFIELD"
                                >
                                    ENDFIELD
                                </span>
                                <span className="text-theme-dim font-normal ml-1">
                                    ]
                                </span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className="text-ui-micro font-ui-mono tracking-ui-widest text-hover-fill"
                                data-text="PROTOCOL"
                            >
                                PROTOCOL
                            </span>
                            <span className="text-theme-dim text-ui-micro">
                                •
                            </span>
                            <span className="text-ui-micro font-ui-mono text-theme-dim tracking-ui-wider">
                                V{version}
                            </span>
                            <span className="text-theme-dim text-ui-micro">
                                //
                            </span>
                            <span
                                className={`text-ui-micro font-ui-mono ${isOnline ? "text-theme-success" : "text-theme-error"}`}
                            >
                                {isOnline ? "ONLINE" : "OFFLINE"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center p-1 bg-black/20 rounded-md border border-theme-highlight/30">
                        <Button
                            variant={
                                currentView === View.DASHBOARD
                                    ? "primary"
                                    : "ghost"
                            }
                            onClick={() => onViewChange(View.DASHBOARD)}
                            className={`text-ui-xs h-8 px-3 md:px-4 py-0 rounded-sm ${currentView === View.DASHBOARD ? "" : "text-theme-dim"}`}
                            title={t("DASHBOARD")}
                            aria-label={t("DASHBOARD")}
                        >
                            <span className="md:hidden" aria-hidden="true">
                                <i className="ri-dashboard-line icon-ui-lg font-normal"></i>
                            </span>
                            <span className="hidden md:flex items-center gap-1">
                                <i className="ri-dashboard-line icon-ui-lg leading-none font-normal"></i>
                                <span className="leading-ui-none">
                                    {t("DASHBOARD")}
                                </span>
                            </span>
                        </Button>
                        <Button
                            variant={
                                currentView === View.SETTINGS
                                    ? "primary"
                                    : "ghost"
                            }
                            onClick={() => onViewChange(View.SETTINGS)}
                            className={`text-ui-xs h-8 px-3 md:px-4 py-0 rounded-sm ${currentView === View.SETTINGS ? "" : "text-theme-dim"}`}
                            title={t("SYSTEM_CONFIG")}
                            aria-label={t("SYSTEM_CONFIG")}
                        >
                            <span className="md:hidden" aria-hidden="true">
                                <i className="ri-settings-3-line icon-ui-lg font-normal"></i>
                            </span>
                            <span className="hidden md:flex items-center gap-1">
                                <i className="ri-settings-3-line icon-ui-lg leading-none font-normal"></i>
                                <span className="leading-ui-none">
                                    {t("SYSTEM_CONFIG")}
                                </span>
                            </span>
                        </Button>
                    </div>

                    <div className="hidden md:flex flex-col items-end text-ui-micro font-ui-mono text-theme-dim border-l border-theme-highlight/30 pl-6">
                        <span className="text-theme-primary text-ui-base leading-ui-none tracking-ui-widest">
                            {now.toLocaleTimeString("en-US", { hour12: false })}
                        </span>
                        <span className="opacity-70">
                            {now.toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderBar;
