import React from "react";

interface TokenTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TABS = [
    { key: "all", label: "All Assets" },
    { key: "Real Estate", label: "Real Estate" },
    { key: "High Value Art", label: "Art / Collectibles" },
    { key: "Other", label: "Other" },
];

export default function TokenTabs({ activeTab, setActiveTab }: TokenTabsProps) {
    return (
        <div className="w-full">
            <div className="overflow-x-auto overflow-y-hidden md:w-max w-full" style={{ scrollbarWidth: 'none' }}>
                <div data-slot="base" className="inline-flex">
                    <div
                        data-slot="tabList"
                        className="flex p-1 h-fit items-center overflow-x-auto bg-transparent dark:bg-transparent gap-5 relative rounded-none flex-nowrap hide-scrollbar"
                        role="tablist"
                        aria-orientation="horizontal"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                data-selected={activeTab === tab.key}
                                data-slot="tab"
                                tabIndex={activeTab === tab.key ? 0 : -1}
                                aria-selected={activeTab === tab.key}
                                role="tab"
                                className={`z-0 w-full px-3 py-1 flex group relative justify-center items-center cursor-pointer transition-opacity tap-highlight-transparent outline-none h-8 text-small rounded-none pb-4`}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {activeTab === tab.key && (
                                    <span className="absolute z-0 bottom-0 shadow-[0_1px_0px_0_rgba(0,0,0,0.05)] rounded-none w-full h-[2px] bg-[#2D6BFF]" data-slot="cursor" style={{ opacity: 1 }}></span>
                                )}
                                <div className={`relative z-10 transition-colors text-sm md:text-base font-medium ${activeTab === tab.key ? 'text-white font-semibold' : 'text-white/40'} whitespace-nowrap`} data-slot="tabContent">
                                    {tab.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
