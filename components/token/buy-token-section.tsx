// Format number to compact string (e.g., 48.5M)

"use client";
import React, { useState, useEffect, useCallback } from "react";
import TokenTabs from "@/components/token/token-tab";
import TokenToolbar from "@/components/token/token-tool-bar";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { toast } from "@/hooks/use-toast";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const CONTRACT_ADDRESS =
  "0x0237b076386435ea40da5076779dc9a3bf46ca07847aa84a2968eb10d43162d0";
const MODULE_NAME = "fa_factory";

const aptosConfig = new AptosConfig({
  network: Network.MAINNET,
  clientConfig: {
    API_KEY: "AG-7DYJWSLTVG7HTH6DJXMNIZNWJCNFYCVUC",
  },
});
const aptos = new Aptos(aptosConfig);
function formatNumberCompact(value: string | number, decimals = 2): string {
  if (value === undefined || value === null || value === "") return "0";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return value.toString();
  return num.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: decimals,
  });
}
function decodeHexString(hexString: string | undefined | null): string {
  try {
    if (
      !hexString ||
      typeof hexString !== "string" ||
      !hexString.startsWith("0x")
    )
      return hexString || "";
    const hex = hexString.slice(2);
    let result = "";
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      if (byte > 0) result += String.fromCharCode(byte);
    }
    return result;
  } catch {
    return hexString || "";
  }
}

function decodeHexStringSafe(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return decodeHexString(val);
  if (val.type === "string" && typeof val.value === "string")
    return decodeHexString(val.value);
  return "";
}

function toStringSafe(val: any): string {
  if (val === undefined || val === null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean")
    return val.toString();
  if (typeof val === "object" && "value" in val) return String(val.value);
  if (typeof val.toString === "function") return val.toString();
  return "";
}

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
}

interface BuyTokenSectionProps {
  tokens: TokenInfo[];
  setTokens: React.Dispatch<React.SetStateAction<TokenInfo[]>>;
}

export default function BuyTokenSection({
  tokens,
  setTokens,
}: BuyTokenSectionProps) {
  const connectedWallet = useConnectedWallet();
  const { safeSignAndSubmitTransaction } = useSafeWallet();
  const [loading, setLoading] = useState(true);
  const [buyAmounts, setBuyAmounts] = useState<{ [symbol: string]: string }>(
    {}
  );
  const [buying, setBuying] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("marketCap");

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const events = await aptos.getModuleEventsByEventType({
        eventType: `${CONTRACT_ADDRESS}::${MODULE_NAME}::TokenCreated`,
        minimumLedgerVersion: 0,
      });
      const fetchedTokens: TokenInfo[] = [];
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        try {
          const eventData = event.data as any;
          let creatorAddress = eventData.creator;
          if (
            event.transaction_version &&
            (!creatorAddress || creatorAddress.includes("0000"))
          ) {
            try {
              const txnDetails = await aptos.getTransactionByVersion({
                ledgerVersion: event.transaction_version,
              });
              if (txnDetails && "sender" in txnDetails) {
                creatorAddress = txnDetails.sender;
              }
            } catch { }
          }
          if (!creatorAddress || creatorAddress.includes("0000")) continue;
          const decodedSymbol = decodeHexString(eventData.symbol);
          // Call get_full_token_info view function
          let fullInfo;
          try {
            const viewArgs = [
              creatorAddress,
              Array.from(new TextEncoder().encode(decodedSymbol)),
            ];
            console.log("Call get_full_token_info:", {
              function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_full_token_info`,
              args: viewArgs,
            });
            fullInfo = await aptos.view({
              payload: {
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_full_token_info`,
                typeArguments: [],
                functionArguments: viewArgs,
              },
            });
            console.log("get_full_token_info result:", fullInfo);
          } catch (e) {
            continue;
          }
          if (!fullInfo || !Array.isArray(fullInfo) || fullInfo.length < 25)
            continue;
          const iconUrl = decodeHexStringSafe(fullInfo[3]);
          fetchedTokens.push({
            symbol: decodeHexStringSafe(fullInfo[0]),
            name: decodeHexStringSafe(fullInfo[1]),
            decimals: Number(fullInfo[2] ?? 6),
            iconUrl,
            projectUrl: decodeHexStringSafe(fullInfo[4]),
            description: decodeHexStringSafe(fullInfo[5]),
            creator: toStringSafe(fullInfo[6]),
            totalSupply: toStringSafe(fullInfo[7]),
            circulatingSupply: toStringSafe(fullInfo[8]),
            k: toStringSafe(fullInfo[9]),
            feeRate: toStringSafe(fullInfo[10]),
            assetType: decodeHexStringSafe(fullInfo[11]),
            backingRatio: toStringSafe(fullInfo[12]),
            withdrawalLimit: toStringSafe(fullInfo[13]),
            withdrawalCooldown: toStringSafe(fullInfo[14]),
            graduationThreshold: toStringSafe(fullInfo[15]),
            graduationTarget: toStringSafe(fullInfo[16]),
            isGraduated: Boolean(fullInfo[17]),
            oraclePrice: toStringSafe(fullInfo[18]),
            reserve: toStringSafe(fullInfo[19]),
            currentPriceApt: toStringSafe(fullInfo[20]),
            currentPriceUsd: toStringSafe(fullInfo[21]),
            liquidity: toStringSafe(fullInfo[22]),
            marketCap: toStringSafe(fullInfo[23]),
            saleStatus: decodeHexStringSafe(fullInfo[24]),
          });
        } catch { }
      }
      console.log("Fetched tokens:", fetchedTokens);
      setTokens(fetchedTokens);
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to fetch tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [setTokens]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleBuy = async (token: TokenInfo) => {
    if (!connectedWallet.connected || !connectedWallet.account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }
    const amount = buyAmounts[token.symbol];
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter amount to buy.",
        variant: "destructive",
      });
      return;
    }
    setBuying(token.symbol);
    try {
      const symbolBytes = Array.from(new TextEncoder().encode(token.symbol));
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
        type_arguments: [],
        arguments: [token.creator, symbolBytes, buyAmounts[token.symbol]],
      };
      let response;
      // Try wallet adapter first
      if (
        connectedWallet.wallet &&
        typeof (connectedWallet.wallet as any).signAndSubmitTransaction ===
        "function"
      ) {
        try {
          const cleanPayload = {
            type: payload.type,
            function: payload.function,
            type_arguments: payload.type_arguments || [],
            arguments: payload.arguments || [],
          };
          response = await (
            connectedWallet.wallet as any
          ).signAndSubmitTransaction({ payload: cleanPayload });
        } catch (err1) {
          try {
            response = await (
              connectedWallet.wallet as any
            ).signAndSubmitTransaction(payload);
          } catch (err2) {
            response = await safeSignAndSubmitTransaction(payload);
          }
        }
      } else {
        response = await safeSignAndSubmitTransaction(payload);
      }
      toast({
        title: "Buy transaction sent!",
        description: (
          <div>
            Buy transaction for {token.symbol} has been sent.<br />
            {response?.hash && (
              <a
                href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                View on explorer
              </a>
            )}
          </div>
        ),
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  // Filtering and sorting logic for grid UI
  const filteredTokens = tokens
    .filter(
      (token) =>
        (activeTab === "all" || token.assetType === activeTab) &&
        (search === "" ||
          token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.symbol.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "marketCap")
        return Number(b.marketCap) - Number(a.marketCap);
      if (sortBy === "createdTime") return 0; // TODO: add createdTime if available
      return 0;
    });

  return (
    <div className="w-full h-full py-10 px-28 md:px-28 flex flex-col gap-6">
      {/* Tabs filter */}
      <TokenTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Toolbar: search, sort, filter buttons */}
      <TokenToolbar
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Token grid */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
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
          ))}
        </div>
      ) : filteredTokens.length === 0 ? (
        <div>Không có token nào trên contract.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 gap-5">
          {filteredTokens.map((token) => {
            const Link = require("next/link").default;
            return (
              <Link
                key={token.symbol}
                href={`/token/buy/${token.symbol}`}
                className="flex flex-col z-10 rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-2 cursor-pointer borderToken min-w-[298px] max-w-[298px] w-full"
                style={{ width: 298 }}
              >
                <div className="relative rounded-xl">
                  <img
                    width="298"
                    height="136"
                    alt={token.name}
                    className="rounded-xl min-h-[136px] max-h-[136px] object-cover w-full rounded-b-none"
                    src={
                      token.iconUrl ||
                      "https://anhdephd.vn/wp-content/uploads/2022/05/background-anime-pc-800x447.jpg"
                    }
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://anhdephd.vn/wp-content/uploads/2022/05/background-anime-pc-800x447.jpg";
                    }}
                  />
                  <div className="absolute top-2 left-2 z-10">
                    {!token.saleStatus || token.saleStatus === "Bonding" ? (
                      <div
                        className="flex border px-[10px] py-1 justify-center items-center max-h-[24px] rounded-full !border-[#24C85866]"
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
                          ${formatNumberCompact(token.liquidity)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-[#707472] text-[12px] font-normal uppercase">
                          MCap
                        </p>
                        <p className="text-md font-medium text-white">
                          ${formatNumberCompact(token.marketCap)}
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
                    {(() => {
                      const threshold = Number(token.graduationThreshold);
                      const target = Number(token.graduationTarget);
                      const reserve = Number(token.reserve);
                      // Optionally show formatted reserve value for debugging or display
                      let progress = 0;
                      let progressText = "0%";
                      if (target > threshold) {
                        if (reserve <= threshold) {
                          progress = 0;
                        } else if (reserve >= target) {
                          progress = 1;
                        } else {
                          progress =
                            (reserve - threshold) / (target - threshold);
                        }
                        progressText = (progress * 100).toFixed(2) + "%";
                      }
                      const belowThreshold = reserve < threshold;
                      // Calculate glow position to align with last filled dot
                      const totalDots = 30;
                      const lastFilledIndex = Math.floor(progress * (totalDots - 1));
                      const glowLeft = (lastFilledIndex / (totalDots - 1)) * 100;
                      return (
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
                            {/* <p className="text-xs text-[#707472]">Reserve: {formatNumberCompact(token.reserve)}</p> */}
                          </div>
                          <div className="relative h-[12px] md:h-[16px] w-full">
                            <div className="flex gap-[3px] md:gap-1 items-center absolute top-0 left-0 right-0">
                              {[...Array(totalDots)].map((_, i) => {
                                const percent = i / (totalDots - 1);
                                const filled = percent <= progress;
                                return (
                                  <div
                                    key={i}
                                    className={`w-[4px] md:w-[6px] h-[12px] md:h-[16px] rounded-full transition-colors duration-200 ${filled
                                      ? "bg-gradient-to-r from-[#2D6BFF] to-[#00C6FB]"
                                      : "bg-[#212121]"
                                      }`}
                                  ></div>
                                );
                              })}
                            </div>
                            {/* Glow effect at progress end */}
                            {!belowThreshold && (
                              <>
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
                                <div
                                  className="absolute h-[12px] md:h-[16px] rounded-full"
                                  style={{
                                    left: `calc(${glowLeft}% )`,
                                    width: "17.8px",
                                    transform: "translateX(-50%)",
                                    background:
                                      "linear-gradient(90deg, rgba(45,107,255,0) 0%, #2D6BFF 77%, #00C6FB 100%)",
                                    filter: "blur(8px)",
                                    opacity: 0.9,
                                  }}
                                ></div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
