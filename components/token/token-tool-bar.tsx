import React from "react";

interface TokenToolbarProps {
  search: string;
  setSearch: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export default function TokenToolbar({
  search,
  setSearch,
  sortBy,
  setSortBy,
}: TokenToolbarProps) {
  return (
    <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
      <div className="flex items-center md:flex-nowrap flex-wrap gap-3">
        <div className="md:min-w-[280px] min-w-full">
          <div className="group flex flex-col w-full relative justify-end">
            <div className="h-full flex flex-col">
              <div className="relative w-full inline-flex tap-highlight-transparent flex-row items-center shadow-sm gap-3 h-10 rounded-full transition-background px-4 py-[10px] bg-[#181a1f] border-1 border-[#292929] min-h-[48px]">
                <div className="inline-flex w-full items-center h-full box-border">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="z-20"
                  >
                    <g clipPath="url(#clip0_2027_5627)">
                      <circle
                        cx="9.58341"
                        cy="9.58335"
                        r="7.91667"
                        stroke="white"
                        strokeOpacity="0.4"
                        strokeWidth="1.5"
                      ></circle>
                      <path
                        d="M15.4167 15.4167L18.3334 18.3334"
                        stroke="white"
                        strokeOpacity="0.4"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_2027_5627">
                        <rect width="20" height="20" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                  <input
                    className="w-full font-normal bg-transparent !outline-none focus-visible:outline-none text-[14px] placeholder:text-[14px] placeholder:text-[#707472]"
                    aria-label="Search for asset..."
                    autoComplete="off"
                    placeholder="Search for asset..."
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full">
          <div className="bg-[#181a1f] relative justify-between transition-all w-8/12 duration-300 cursor-pointer hover:opacity-85 rounded-full py-3 px-4 flex items-center gap-[2px]">
            <div className="flex items-center gap-[2px]">
              🏆<p className="text-[14px] font-medium">About to Graduate</p>
            </div>
          </div>
          <div className="bg-[#181a1f] min-w-[123px] justify-center transition-all duration-300 cursor-pointer hover:opacity-85 rounded-full py-3 px-4 flex items-center gap-[2px]">
            🔥<p className="text-[14px] font-medium">Trending</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <DropdownSortBy sortBy={sortBy} setSortBy={setSortBy} />
      </div>
    </div>
  );
}

// Custom DropdownSortBy component
const sortOptions = [
  { value: "marketCap", label: "Market Cap" },
  { value: "createdTime", label: "Created Time" },
  { value: "trending", label: "Trending" },
  { value: "volume24hs", label: "Volume" },
];

function DropdownSortBy({
  sortBy,
  setSortBy,
}: {
  sortBy: string;
  setSortBy: (val: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative w-max min-w-[220px]">
      <button
        type="button"
        className={`group flex items-center w-full h-[48px] min-h-[48px] rounded-full px-5 pr-10 bg-[#181a1f] focus:outline-none relative transition-colors border border-transparent ${
          !open ? "hover:border-[#2D6BFF]" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Inline up/down icon */}
        <span className="mr-2 opacity-60">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <g>
              <path
                d="M10 4.5V15.5"
                stroke="#707472"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M7 7.5L10 4.5L13 7.5"
                stroke="#707472"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 12.5L10 15.5L7 12.5"
                stroke="#707472"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </span>
        <span className="text-[15px] font-medium text-[#707472] mr-1">
          Sort by:
        </span>
        <span className="text-[16px] font-semibold text-white ml-1">
          {sortOptions.find((o) => o.value === sortBy)?.label || "Sort"}
        </span>
        {/* Chevron icon */}
        <span
          className={`absolute right-4 w-5 h-5 flex items-center transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7 8L10 11L13 8"
              stroke="#707472"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open && (
        <ul
          className="absolute z-50 top-[52px] right-0 bg-[#181a1f] rounded-2xl shadow-lg py-1 mt-1  min-w-[160px] w-[160px]"
          role="listbox"
        >
          {sortOptions.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={sortBy === opt.value}
              className={`px-4 py-1.5 text-[15px] font-semibold cursor-pointer transition-colors rounded-lg ${
                sortBy === opt.value
                  ? "bg-[#232F47] text-[#2D6BFF]"
                  : "text-white hover:bg-[#2D6BFF] hover:bg-[#232F47]/80 hover:px-5"
              }`}
              style={{ margin: "2px 0" }}
              onClick={() => {
                setSortBy(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
