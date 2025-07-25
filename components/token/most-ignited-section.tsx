// Format number to compact string (e.g., 48.5M)
function formatNumberCompact(value: string | number, decimals = 2): string {
  if (value === undefined || value === null || value === "") return "0";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return value.toString();
  return num.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: decimals,
  });
}
import React, { useState, useRef } from "react";
import "@/styles/custom-scrollbar.css";
import "@/styles/custom-scrollbar.css";

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
  projectUrl: string;
  description: string;
  creator: string;
  totalSupply: string;
  circulatingSupply: string;
  k: string;
  feeRate: string;
  assetType: string;
  backingRatio: string;
  withdrawalLimit: string;
  withdrawalCooldown: string;
  graduationThreshold: string;
  graduationTarget: string;
  isGraduated: boolean;
  oraclePrice: string;
  reserve: string;
  currentPriceApt: string;
  currentPriceUsd: string;
  liquidity: string;
  marketCap: string;
  saleStatus: string;
  createdAgo?: string;
}

function formatNumber(num: string | number, digits = 2) {
  const n = Number(num);
  if (isNaN(n)) return num as string;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(digits)}K`;
  return `$${n.toFixed(digits)}`;
}

function BondingCurveProgress({
  threshold,
  target,
  circulating,
}: {
  threshold: number;
  target: number;
  circulating: number;
}) {
  let progress = 0;
  let progressText = "0%";
  if (target > threshold) {
    progress = (circulating - threshold) / (target - threshold);
    progress = Math.max(0, Math.min(1, progress));
    progressText = (progress * 100).toFixed(0) + "%";
  } else {
    progress = 1;
    progressText = "100%";
  }
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <p className="text-[#707472] text-[12px] font-normal">
          Bonding Curve Progress
        </p>
        <p className="text-[#FF9900] text-[12px] font-normal">{progressText}</p>
      </div>
      <div className="relative h-[12px] md:h-[16px] w-full">
        <div className="flex gap-[3px] md:gap-1 items-center absolute top-0 left-0 right-0">
          {[...Array(30)].map((_, i) => {
            const percent = i / 29;
            const filled = percent <= progress;
            return (
              <div
                key={i}
                className={`h-[8px] md:h-[12px] w-[6px] md:w-[8px] rounded-full ${filled ? "bg-[#FF9900]" : "bg-[#181a1f]"
                  }`}
              />
            );
          })}
        </div>
        {/* Glow effect at progress end */}
        {progress > 0 && (
          <div
            className="absolute h-[12px] md:h-[16px] rounded-full"
            style={{
              left: `${progress * 100}%`,
              width: "23.8px",
              transform: "translateX(-100%)",
              background:
                "linear-gradient(90deg, rgba(255,153,0,0) 0%, #FF9900 77%, #FF9900 100%)",
              filter: "blur(4px)",
              opacity: 0.8,
            }}
          ></div>
        )}
      </div>
    </div>
  );
}

export default function MostIgnitedSection({
  tokens = [],
}: {
  tokens: TokenInfo[];
}) {
  const [start, setStart] = useState(0);
  const [loading, setLoading] = useState(false);
  const visibleCount = 4;
  const end = start + visibleCount;
  const canPrev = start > 0;
  const canNext = end < tokens.length;

  // Simulate loading if tokens is empty (for demo, replace with real fetch logic if needed)
  React.useEffect(() => {
    if (tokens.length === 0) {
      setLoading(true);
      const timeout = setTimeout(() => setLoading(false), 1200);
      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [tokens]);

  const handlePrev = () => {
    setStart((s) => Math.max(0, s - visibleCount));
  };
  const handleNext = () => {
    setStart((s) => Math.min(tokens.length - visibleCount, s + visibleCount));
  };

  // Ref for horizontal scroll
  const scrollRef = useRef<HTMLDivElement>(null);

  // Allow shift+wheel to scroll horizontally
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.shiftKey && scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Lọc chỉ các token đã graduated
  const graduatedTokens = tokens.filter(token => token.isGraduated);
  return (
    <section className="pt-40 flex flex-col gap-y-16 md:gap-y-24 items-center justify-center relative">
      <div className="will-change-opacity absolute h-[414px] overflow-hidden w-[100dvw] left-1/2 -translate-x-1/2 -top-18 mask-[radial-gradient(90%_80%_at_50%_100%,#D9D9D9_80%,rgba(115,115,115,0)_100%)] md:mask-[radial-gradient(50%_65.7%_at_50%_34.3%,#D9D9D9_0%,rgba(115,115,115,0)_100%)]">
        {" "}
        <div className="transform-gpu top-1/2 -translate-y-1/2 absolute h-[60px] md:h-[90px] w-full left-1/2 -translate-x-1/2 md:blur-[50px] blur-[25px] [border-radius:50%_100%] bg-[#2487B4] mix-blend-plus-lighter"></div>{" "}
        <div className="transform-gpu absolute top-1/2 -translate-y-1/2 h-[60px] md:h-[90px] w-full -right-[35%] md:blur-[50px] blur-[25px] [border-radius:50%_100%] bg-[#79FBFD] mix-blend-plus-lighter"></div>{" "}
        <div className="transform-gpu absolute top-1/2 -translate-y-1/2 h-[60px] md:h-[90px] w-full -left-[35%] md:blur-[50px] blur-[25px] [border-radius:50%_100%] bg-[#ABF2FF] mix-blend-plus-lighter"></div>{" "}
      </div>
      <div className="relative w-full flex flex-col md:flex-row gap-8 md:gap-0 px-4 md:px-20 bg-[#171a2040] md:rounded-[24px] lg:rounded-[48px] pt-40 pb-20 gradient-border">
        <div className="inset-0"></div>
        {/* Left: Title, subtitle, nav */}
        <div className="relative flex md:min-w-[313px] md:min-h-[367px] z-10 justify-between flex-col pr-10">
          {/* Blurred grid overlay and gray bg */}
          <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
            <div className="w-full h-fullbackdrop-blur-[2px]">
              {/* SVG grid pattern, similar to hero section */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 340 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full opacity-40"
              >
                <defs>
                  <pattern
                    id="grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#3A3A3A"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[40px] font-semibold leading-10">Most Ignited</p>
            <p className="text-[16px] font-normal text-[#9FA3A0]">
              Hot real-world assets. Live. Liquid. On-chain.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 mt-8">
            <button
              type="button"
              className="z-0 group relative box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-small gap-2 px-0 !gap-0 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground min-w-10 data-[hover=true]:opacity-hover bg-[#121212] rounded-full w-12 h-12 flex justify-center items-center hover:bg-[#2A2A2A] transition-colors"
              onClick={handlePrev}
              disabled={!canPrev}
              tabIndex={0}
              aria-label="Previous"
            >
              {/* Left Arrow Icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="#9FA3A0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="z-0 group relative box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu data-[pressed=true]:scale-[0.97] outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-small gap-2 px-0 !gap-0 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground min-w-10 data-[hover=true]:opacity-hover bg-[#121212] rounded-full w-12 h-12 flex justify-center items-center hover:bg-[#2A2A2A] transition-colors"
              onClick={handleNext}
              disabled={!canNext}
              tabIndex={0}
              aria-label="Next"
            >
              {/* Right Arrow Icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 5L16 12L9 19"
                  stroke="#9FA3A0"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Right: Horizontal card row */}
        <div
          className="flex-1 overflow-x-auto custom-scrollbar hide-scrollbar"
          ref={scrollRef}
          onWheel={handleWheel}
        >
          <div className="flex gap-5 pb-2">
            {loading
              ? Array.from({ length: visibleCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col z-10 rounded-xl min-w-[298px] max-w-[298px] w-full animate-pulse bg-[#0f1317] borderToken"
                  style={{ minHeight: 367, width: 298 }}
                >
                  <div className="relative rounded-xl">
                    <div className="rounded-xl min-h-[136px] max-h-[136px] w-full bg-[#121419]" />
                  </div>
                  <div className="bg-[#121419] py-[14px] px-5 rounded-xl rounded-t-none flex-1 flex flex-col justify-between">
                    <div className="flex flex-col gap-2 border-b border-b-[#FFFFFF1A] pb-5">
                      <div className="h-5 bg-[#181a1f] rounded w-2/3 mb-2" />
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-[#181a1f] rounded w-1/4" />
                        <div className="h-3 bg-[#181a1f] rounded w-1/4" />
                      </div>
                    </div>
                    <div className="pt-5 flex flex-col gap-5 flex-1">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-[#181a1f] rounded w-1/4" />
                        <div className="h-4 bg-[#181a1f] rounded w-1/4" />
                        <div className="h-4 bg-[#181a1f] rounded w-1/4" />
                      </div>
                      <div className="h-3 bg-[#181a1f] rounded w-full" />
                    </div>
                  </div>
                </div>
              ))
              : graduatedTokens.slice(start, end).map((token, idx) => {
                // Card style copied from buy-token-section
                // (You may want to extract this as a shared component for DRY)
                const threshold = Number(token.graduationThreshold);
                const target = Number(token.graduationTarget);
                const reserve = Number(token.reserve);
                let progress = 0;
                let progressText = "0%";
                if (target > threshold) {
                  if (reserve <= threshold) {
                    progress = 0;
                  } else if (reserve >= target) {
                    progress = 1;
                  } else {
                    progress = (reserve - threshold) / (target - threshold);
                  }
                  progressText = (progress * 100).toFixed(2) + "%";
                }
                const belowThreshold = reserve < threshold;
                return (
                  <a
                    key={token.symbol + idx}
                    href={`/token/buy/${token.symbol}`}
                    className="flex flex-col z-10 rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-2 cursor-pointer borderToken min-w-[298px] max-w-[298px] w-full"
                    style={{ minHeight: 367, width: 298 }}
                  >
                    <div className="relative rounded-xl">
                      <img
                        width="298"
                        height="136"
                        alt={token.name}
                        className="rounded-xl min-h-[136px] max-h-[136px] object-cover w-full rounded-b-none"
                        src={
                          token.iconUrl ||
                          "https://anhdephd.vn/wp-content/uploads/2022/05/background-anime-ngau.jpg"
                        }
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://anhdephd.vn/wp-content/uploads/2022/05/background-anime-ngau.jpg";
                        }}
                      />
                      <div className="absolute top-2 left-2 z-10">
                        {!token.saleStatus ||
                          token.saleStatus === "Bonding" ? (
                          <div
                            className="flex border px-[10px] py-2 justify-center items-center max-h-[24px] rounded-full !border-[#24C85866]"
                            style={{
                              background: 'rgba(20, 20, 20, 0.55)',
                              backdropFilter: 'blur(6px)',
                              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
                            }}
                          >
                            <p className="text-[11px] text-[#24C858] font-medium uppercase">
                              Bonding
                            </p>
                          </div>
                        ) : (
                          <div
                            className="flex px-3 py-1 items-center rounded-full border border-[#2D6BFF33] min-h-[24px]"
                            style={{
                              background: 'rgba(20, 20, 20, 0.55)',
                              backdropFilter: 'blur(6px)',
                              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.12)',
                            }}
                          >
                            <span className="text-[11px] text-[#2D6BFF] font-semibold uppercase tracking-wide drop-shadow-sm">
                              {token.saleStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#181a1f] py-[14px] px-5 rounded-xl rounded-t-none">
                      <div className="flex flex-col gap-2 border-b border-b-[#FFFFFF1A] pb-5">
                        <p className="text-[20px] font-medium text-white line-clamp-1">
                          {token.name}
                        </p>
                        <div className="flex justify-between items-center">
                          <p className="text-[#707472] text-[12px] font-normal">
                            {token.symbol}
                          </p>
                          <p className="text-[#707472] text-[12px] font-normal uppercase">
                            {token.assetType}
                          </p>
                        </div>
                      </div>
                      <div className="pt-5 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col gap-1">
                            <p className="text-[#707472] text-[12px] font-normal uppercase">
                              Daily Volume
                            </p>
                            <p className="text-md font-medium text-white">
                              {formatNumberCompact(token.liquidity)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[#707472] text-[12px] font-normal uppercase">
                              MCap
                            </p>
                            <p className="text-md font-medium text-white">
                              {formatNumberCompact(token.marketCap)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-[#707472] text-[12px] font-normal uppercase">
                              CREATED BY
                            </p>
                            <div className="flex items-center gap-[6px]">
                              <p className="text-md font-medium text-white">
                                {token.creator
                                  ? token.creator.slice(0, 4) +
                                  "..." +
                                  token.creator.slice(-3)
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* Bonding Curve Progress Bar */}
                        <div className="flex flex-col gap-[6px]">
                          <div className="flex items-center justify-between">
                            <p className="text-[#707472] text-[12px] font-normal">
                              Bonding Curve Progress
                            </p>
                            <p
                              className={`text-[#2D6BFF] text-[12px] font-normal`}
                            >
                              {progressText}
                            </p>
                          </div>
                          <div className="relative h-[12px] md:h-[16px] w-full">
                            <div className="flex gap-[3px] md:gap-1 items-center absolute top-0 left-0 right-0">
                              {(() => {
                                const totalDots = 30;
                                const lastFilledIndex = Math.floor(progress * (totalDots - 1));
                                return [...Array(totalDots)].map((_, i) => {
                                  // All dots are black by default
                                  // Only the completed portion is blue gradient
                                  // Match buy-token-section: w-[4px] md:w-[6px] h-[12px] md:h-[16px] rounded-full
                                  if (i <= lastFilledIndex) {
                                    return (
                                      <div
                                        key={i}
                                        className="w-[7px] md:w-[10px] h-[12px] md:h-[16px] rounded-full bg-gradient-to-r from-[#2D6BFF] to-[#00C6FB] shadow-[0_0_8px_2px_rgba(45,107,255,0.35)] border border-[#23272f]"
                                      />
                                    );
                                  } else {
                                    return (
                                      <div
                                        key={i}
                                        className="w-[5px] md:w-[7px] h-[12px] md:h-[16px] rounded-full bg-[#212121] border border-[#23272f]"
                                      />
                                    );
                                  }
                                });
                              })()}
                            </div>
                            {/* Glow effect at progress end */}
                            {!belowThreshold && (() => {
                              const totalDots = 30;
                              const lastFilledIndex = Math.floor(progress * (totalDots - 1));
                              const glowLeft = (lastFilledIndex / (totalDots - 1)) * 100;
                              return (
                                <div
                                  className="absolute h-[12px] md:h-[16px] rounded-full"
                                  style={{
                                    left: `calc(${glowLeft}% )`,
                                    width: "23.8px",
                                    transform: "translateX(-50%)",
                                    background:
                                      "linear-gradient(90deg, rgba(45,107,255,0) 0%, #2D6BFF 77%, #00C6FB 100%)",
                                    filter: "blur(4px)",
                                    opacity: 0.8,
                                  }}
                                ></div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
