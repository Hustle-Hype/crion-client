import React from "react";

interface TokenToolbarProps {
    search: string;
    setSearch: (val: string) => void;
    sortBy: string;
    setSortBy: (val: string) => void;
}

export default function TokenToolbar({ search, setSearch, sortBy, setSortBy }: TokenToolbarProps) {
    return (
        <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
            <div className="flex items-center md:flex-nowrap flex-wrap gap-3">
                <div className="md:min-w-[280px] min-w-full">
                    <div className="group flex flex-col w-full relative justify-end">
                        <div className="h-full flex flex-col">
                            <div className="relative w-full inline-flex tap-highlight-transparent flex-row items-center shadow-sm gap-3 h-10 rounded-full transition-background px-4 py-[10px] bg-[#0F0F0F] border-1 border-[#292929] min-h-[48px]">
                                <div className="inline-flex w-full items-center h-full box-border">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="z-20"><g clipPath="url(#clip0_2027_5627)"><circle cx="9.58341" cy="9.58335" r="7.91667" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"></circle><path d="M15.4167 15.4167L18.3334 18.3334" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round"></path></g><defs><clipPath id="clip0_2027_5627"><rect width="20" height="20" fill="white"></rect></clipPath></defs></svg>
                                    <input
                                        className="w-full font-normal bg-transparent !outline-none focus-visible:outline-none text-[14px] placeholder:text-[14px] placeholder:text-[#707472]"
                                        aria-label="Search for asset..."
                                        autoComplete="off"
                                        placeholder="Search for asset..."
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full">
                    <div className="bg-[#1D1C1C] relative justify-between transition-all w-8/12 duration-300 cursor-pointer hover:opacity-85 rounded-full py-3 px-4 flex items-center gap-[2px]">
                        <div className="flex items-center gap-[2px]">🏆<p className="text-[14px] font-medium">About to Graduate</p></div>
                    </div>
                    <div className="bg-[#1D1C1C] min-w-[123px] justify-center transition-all duration-300 cursor-pointer hover:opacity-85 rounded-full py-3 px-4 flex items-center gap-[2px]">🔥<p className="text-[14px] font-medium">Trending</p></div>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-[#1A1A1A] rounded-full w-max py-3 hover:border-primary border-1 border-transparent pl-4 max-h-[48px] flex items-center gap-1 min-w-full md:min-w-max">
                    <div className="flex items-center gap-1 w-full md:w-max">
                        <img width="20" height="20" alt="" src="/icons/ic-arrow.svg" />
                        <p className="text-[14px] font-medium text-[#707472] min-w-[60px]">Sort by:</p>
                        <select
                            className="bg-transparent text-white text-[14px] font-medium outline-none border-none min-w-[100px]"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                        >
                            <option value="marketCap">Market Cap</option>
                            <option value="createdTime">Created Time</option>
                            <option value="volume24hs">Volume</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
