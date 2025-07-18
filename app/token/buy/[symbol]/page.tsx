"use client";
import { toast } from "@/hooks/use-toast";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useParams } from "next/navigation";

import { useCallback, useEffect, useState } from "react";
import { getIssuerScore } from "@/lib/issuer-score";

const CONTRACT_ADDRESS =
  "0x845b1c620ba3e828749a20809f6aa960523aad5b73831f801051392a3286f91a";
const MODULE_NAME = "fa_factory";

const aptosConfig = new AptosConfig({
  network: Network.TESTNET,
  clientConfig: {
    API_KEY: "AG-9W2L7VUVYZ8VCUMYY8VMRVMICKYNYC68H",
  },
});
const aptos = new Aptos(aptosConfig);

function decodeHexString(hexString: string): string {
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

function formatNumberCompact(value: string | number, decimals = 2): string {
  if (value === undefined || value === null || value === "") return "0";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return value.toString();
  return num.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: decimals,
  });
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

// Simple skeleton component (more rounded)
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#181a1f] rounded-xl ${className}`} />
  );
}

export default function TokenDetailPage() {
  // All hooks must be at the top level and in the same order every render
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const params = useParams();
  const symbol =
    typeof params?.symbol === "string"
      ? params.symbol
      : Array.isArray(params?.symbol)
        ? params.symbol[0]
        : "";
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [buying, setBuying] = useState(false);
  const [selling, setSelling] = useState(false);
  const [issuerScore, setIssuerScore] = useState<number | null>(null);
  const [buyingTab, setBuyingTab] = useState<"buy" | "sell">("buy");
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "chat">(
    "overview"
  );
  const connectedWallet = useConnectedWallet();
  const { safeSignAndSubmitTransaction } = useSafeWallet();
  const [userTokenBalance, setUserTokenBalance] = useState<string>("0");
  const [aptosInWalletUser, setAptosInWalletUser] = useState<string>("0");

  // Copy to clipboard helper
  function handleCopy(text: string, key: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1200);
  }
  // Fetch user token balance and Aptos balance
  // Helper: parse balance string to number
  function parseBalance(balance: string) {
    if (!balance) return 0;
    return Number(balance.replace(/,/g, ""));
  }

  // Handlers for quick amount buttons
  function handleBuyQuickAmount(val: "reset" | "0.1" | "0.2" | "0.5" | "max") {
    if (val === "reset") setBuyAmount("");
    else if (val === "max")
      setBuyAmount(parseBalance(aptosInWalletUser).toString());
    else setBuyAmount(val);
  }
  function handleSellQuickAmount(val: "reset" | "0.1" | "0.2" | "0.5" | "max") {
    if (val === "reset") setSellAmount("");
    else if (val === "max")
      setSellAmount(parseBalance(userTokenBalance).toString());
    else setSellAmount(val);
  }
  useEffect(() => {
    const fetchBalances = async () => {
      if (!connectedWallet.connected || !connectedWallet.account) {
        setUserTokenBalance("0");
        setAptosInWalletUser("0");
        return;
      }
      // Fetch token balance
      if (token) {
        try {
          const tokenType = `${token.creator}::${MODULE_NAME}::${token.symbol}`;
          // Suppress TS error: resourceType is dynamic, not a static template literal
          const resourceType = `0x1::coin::CoinStore<${tokenType}>`;
          const res = await aptos.getAccountResource({
            accountAddress: connectedWallet.account.address,
            resourceType: resourceType as any, // Suppress TS2322
          });
          const raw = res?.data?.coin?.value || "0";
          const decimals = token.decimals || 6;
          const value = Number(raw) / Math.pow(10, decimals);
          setUserTokenBalance(
            value.toLocaleString(undefined, { maximumFractionDigits: 6 })
          );
        } catch {
          setUserTokenBalance("0");
        }
      }
      // Fetch Aptos (APT) balance using getAccountAPTAmount for accuracy
      try {
        const res = await aptos.getAccountAPTAmount({
          accountAddress: connectedWallet.account.address,
        });
        const apt = Number(res) / 1e8;
        setAptosInWalletUser(
          apt.toLocaleString(undefined, { maximumFractionDigits: 4 })
        );
      } catch {
        setAptosInWalletUser("0");
      }
    };
    fetchBalances();
  }, [token, connectedWallet.connected, connectedWallet.account]);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    try {
      // Find creator address by searching events
      const events = await aptos.getModuleEventsByEventType({
        eventType: `${CONTRACT_ADDRESS}::${MODULE_NAME}::TokenCreated`,
        minimumLedgerVersion: 0,
      });
      let creatorAddress: string | null = null;
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const eventSymbol = decodeHexString(event.data.symbol);
        if (eventSymbol === symbol) {
          creatorAddress = event.data.creator;
          break;
        }
      }
      if (!creatorAddress) throw new Error("Không tìm thấy token này!");
      // Call get_full_token_info
      const viewArgs: [string, number[]] = [
        creatorAddress,
        Array.from(new TextEncoder().encode(symbol)),
      ];
      const fullInfo = await aptos.view({
        payload: {
          function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_full_token_info`,
          typeArguments: [],
          functionArguments: viewArgs,
        },
      });
      if (!fullInfo || !Array.isArray(fullInfo) || fullInfo.length < 25)
        throw new Error("Không lấy được thông tin token!");
      setToken({
        symbol: decodeHexStringSafe(fullInfo[0]),
        name: decodeHexStringSafe(fullInfo[1]),
        decimals: Number(fullInfo[2] ?? 6),
        iconUrl: decodeHexStringSafe(fullInfo[3]),
        projectUrl: decodeHexStringSafe(fullInfo[4]),
        description: decodeHexStringSafe(fullInfo[5]),
        creator: String(fullInfo[6]),
        totalSupply: String(fullInfo[7]),
        circulatingSupply: String(fullInfo[8]),
        k: String(fullInfo[9]),
        feeRate: String(fullInfo[10]),
        assetType: decodeHexStringSafe(fullInfo[11]),
        backingRatio: String(fullInfo[12]),
        withdrawalLimit: String(fullInfo[13]),
        withdrawalCooldown: String(fullInfo[14]),
        graduationThreshold: String(fullInfo[15]),
        graduationTarget: String(fullInfo[16]),
        isGraduated: Boolean(fullInfo[17]),
        oraclePrice: String(fullInfo[18]),
        reserve: String(fullInfo[19]),
        currentPriceApt: String(fullInfo[20]),
        currentPriceUsd: String(fullInfo[21]),
        liquidity: String(fullInfo[22]),
        marketCap: String(fullInfo[23]),
        saleStatus: decodeHexStringSafe(fullInfo[24]),
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Fetch issuer trust score when token loaded
  useEffect(() => {
    if (token?.creator) {
      getIssuerScore(token.creator).then(setIssuerScore);
    }
  }, [token?.creator]);

  // Removed trade history effect

  const handleBuy = async () => {
    if (!connectedWallet.connected || !connectedWallet.account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Nhập số lượng muốn mua.",
        variant: "destructive",
      });
      return;
    }
    if (!token) return;
    setBuying(true);
    try {
      // Arguments: creatorAddress, symbolBytes, amountU64
      const creatorAddress = token.creator.startsWith("0x")
        ? token.creator
        : `0x${token.creator}`;
      const symbolString = token.symbol;
      const symbolBytes = Array.from(new TextEncoder().encode(symbolString));
      // Convert buyAmount to integer string (u64) with decimals
      let amountU64 = "0";
      try {
        const decimals = token.decimals || 6;
        const n = parseFloat(buyAmount);
        amountU64 = Math.floor(n * Math.pow(10, decimals)).toString();
      } catch {
        amountU64 = "0";
      }
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
        type_arguments: [],
        arguments: [creatorAddress, symbolBytes, amountU64],
      };
      let response;
      const walletAny = connectedWallet.wallet as any;
      if (
        walletAny &&
        typeof walletAny.signAndSubmitTransaction === "function"
      ) {
        try {
          response = await walletAny.signAndSubmitTransaction({ payload });
        } catch (err1) {
          response = await safeSignAndSubmitTransaction(payload);
        }
      } else {
        response = await safeSignAndSubmitTransaction(payload);
      }
      toast({
        title: "Đã gửi giao dịch mua token!",
        description: (
          <div>
            Đã gửi giao dịch mua {token.symbol}.<br />
            {response?.hash && (
              <a
                href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Xem trên explorer
              </a>
            )}
          </div>
        ),
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setBuying(false);
    }
  };

  const handleSell = async () => {
    if (!connectedWallet.connected || !connectedWallet.account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Nhập số lượng muốn bán.",
        variant: "destructive",
      });
      return;
    }
    if (!token) return;
    setSelling(true);
    try {
      // Arguments: creatorAddress, symbolBytes, amountU64
      const creatorAddress = token.creator.startsWith("0x")
        ? token.creator
        : `0x${token.creator}`;
      const symbolString = token.symbol;
      const symbolBytes = Array.from(new TextEncoder().encode(symbolString));
      // Convert sellAmount to integer string (u64) with decimals
      let amountU64 = "0";
      try {
        const decimals = token.decimals || 6;
        const n = parseFloat(sellAmount);
        amountU64 = Math.floor(n * Math.pow(10, decimals)).toString();
      } catch {
        amountU64 = "0";
      }
      const payload = {
        type: "entry_function_payload",
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::sell_tokens`,
        type_arguments: [],
        arguments: [creatorAddress, symbolBytes, amountU64],
      };
      let response;
      const walletAny = connectedWallet.wallet as any;
      if (
        walletAny &&
        typeof walletAny.signAndSubmitTransaction === "function"
      ) {
        try {
          response = await walletAny.signAndSubmitTransaction({ payload });
        } catch (err1) {
          response = await safeSignAndSubmitTransaction(payload);
        }
      } else {
        response = await safeSignAndSubmitTransaction(payload);
      }
      toast({
        title: "Đã gửi giao dịch bán token!",
        description: (
          <div>
            Đã gửi giao dịch bán {token.symbol}.<br />
            {response?.hash && (
              <a
                href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Xem trên explorer
              </a>
            )}
          </div>
        ),
      });
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setSelling(false);
    }
  };

  // Move all hooks above any early returns to follow Rules of Hooks
  // ...existing code...

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Main section skeleton */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-stretch p-3 gap-6">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="w-[140px] h-[140px]" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex flex-col gap-4 justify-between h-full">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:gap-2">
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
          </div>
        </div>
        {/* Right/Sidebar skeleton */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  if (!token) {
    return <div className="p-10 text-center">Không tìm thấy token.</div>;
  }

  // Helper to format category (replace _ with space)
  function formatCategory(cat: string) {
    return cat ? cat.replace(/_/g, " ") : "";
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left/Main section */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-stretch p-3 gap-6">
          <div className="flex flex-col gap-2.5">
            <div className="relative w-[140px] h-[140px] border border-white/20 bg-white/5 p-2 rounded-2xl">
              {token.iconUrl && (
                <img
                  alt={token.name}
                  className="size-[132px] object-cover rounded-[12px]"
                  crossOrigin="anonymous"
                  src={token.iconUrl}
                />
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col gap-4 justify-between h-full">
              <div className="flex flex-col gap-2">
                <div className="flex gap-x-2 justify-between">
                  <h1 className="text-[24px] font-bold text-white line-clamp-1">
                    {token.name}
                  </h1>
                  <div className="bg-[#181a1f] rounded-full max-h-8 py-2 pl-4 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-1 text-white text-sm font-normal">
                      <span className="font-medium whitespace-nowrap">
                        Token address:
                      </span>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() =>
                          handleCopy(token.creator, "token-address")
                        }
                        title="Sao chép địa chỉ token creator"
                      >
                        {token.creator.slice(0, 4)}...{token.creator.slice(-3)}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        tabIndex={0}
                        onClick={() =>
                          handleCopy(token.creator, "token-address")
                        }
                        className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none text-tiny gap-2 rounded-full px-0 !gap-0 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground min-w-8 bg-[#313131] h-[32px] w-[32px] transition-colors border border-white/20 hover:bg-[#181a1f] active:scale-95"
                        title="Sao chép địa chỉ token creator"
                      >
                        {copiedKey === "token-address" ? (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            className="w-4 h-4 text-green-400"
                          >
                            <path
                              d="M5 10.5l4 4 6-7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            className="w-4 h-4 text-white/64"
                          >
                            <rect
                              x="4"
                              y="4"
                              width="12"
                              height="12"
                              rx="3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            />
                            <path
                              d="M8 8h4v4H8z"
                              fill="currentColor"
                              fillOpacity=".3"
                            />
                          </svg>
                        )}
                      </button>
                      {copiedKey === "token-address" && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#181a1f] text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-normal text-white">
                      ${token.symbol}
                    </span>
                  </div>
                </div>
                <p className="text-[14px] font-normal text-[#9FA3A0]">
                  {token.description}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#7E7E7E] text-[12px] font-normal">
                      Created by:
                    </span>
                    <div className="flex items-center gap-2">
                      <img
                        alt={token.creator}
                        className="rounded-md object-cover size-8"
                        crossOrigin="anonymous"
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${token.creator}&scale=70`}
                      />
                      <span
                        className="text-white text-[14px] font-normal"
                        tabIndex={0}
                      >
                        {token.creator.slice(0, 4)}...{token.creator.slice(-3)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#7E7E7E] text-[12px] font-normal">
                      Created Date:
                    </span>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9FA3A0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="4"
                        stroke="#9FA3A0"
                        strokeWidth="2"
                      />
                      <path
                        d="M16 2v4M8 2v4M3 10h18"
                        stroke="#9FA3A0"
                        strokeWidth="2"
                      />
                      <circle cx="16" cy="16" r="2" fill="#9FA3A0" />
                    </svg>
                    <span className="text-white text-[14px] font-medium">
                      July 14, 2025
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 cursor-pointer">
                  <div tabIndex={0}>
                    <svg
                      width="15"
                      height="17"
                      viewBox="0 0 15 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-white/64"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M8.7574 2.83328C8.7574 1.2685 10.0317 0 11.6036 0C13.1755 0 14.4497 1.2685 14.4497 2.83328C14.4497 4.39806 13.1755 5.66656 11.6036 5.66656C10.8098 5.66656 10.0925 5.34296 9.57684 4.82236L5.63681 7.50497C5.67324 7.68596 5.69231 7.87293 5.69231 8.06395C5.69231 8.44221 5.61757 8.80376 5.48204 9.13423L9.80229 11.9727C10.2926 11.5734 10.92 11.3331 11.6036 11.3331C13.1755 11.3331 14.4497 12.6016 14.4497 14.1664C14.4497 15.7312 13.1755 16.9997 11.6036 16.9997C10.0317 16.9997 8.7574 15.7312 8.7574 14.1664C8.7574 13.7565 8.84513 13.3664 9.00279 13.0142L4.71747 10.1987C4.21758 10.6332 3.56279 10.8972 2.84616 10.8972C1.27427 10.8972 0 9.62872 0 8.06395C0 6.49917 1.27427 5.23067 2.84616 5.23067C3.75005 5.23067 4.55466 5.65006 5.07563 6.30278L8.89416 3.70289C8.80534 3.42849 8.7574 3.1361 8.7574 2.83328Z"
                        fill="white"
                        fillOpacity="0.64"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs: Overview, Trade History, Chat */}
        <div className="flex flex-col gap-4 md:gap-2">
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="items-center text-muted-foreground overflow-y-auto bg-transparent h-auto p-0 overflow-x-auto w-full flex"
            tabIndex={0}
            data-orientation="horizontal"
            style={{ outline: "none" }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              aria-controls="overview-tab"
              data-state={activeTab === "overview" ? "active" : "inactive"}
              className={`relative inline-flex items-center justify-center whitespace-nowrap font-medium text-white/40 ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-white data-[state=active]:font-medium hover:text-white/90 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-transparent after:transition-all after:duration-200 ${activeTab === "overview"
                ? "text-white font-medium after:bg-[#2D6BFF]"
                : ""
                } hover:after:bg-[#2D6BFF]/30 px-4 py-3 text-sm md:text-base`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "history"}
              aria-controls="history-tab"
              data-state={activeTab === "history" ? "active" : "inactive"}
              className={`relative inline-flex items-center justify-center whitespace-nowrap font-medium text-white/40 ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-white data-[state=active]:font-medium hover:text-white/90 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-transparent after:transition-all after:duration-200 ${activeTab === "history"
                ? "text-white font-medium after:bg-[#2D6BFF]"
                : ""
                } hover:after:bg-[#2D6BFF]/30 px-4 py-3 text-sm md:text-base`}
              onClick={() => setActiveTab("history")}
            >
              Trade History
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "chat"}
              aria-controls="chat-tab"
              data-state={activeTab === "chat" ? "active" : "inactive"}
              className={`relative inline-flex items-center justify-center whitespace-nowrap font-medium text-white/40 ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-white data-[state=active]:font-medium hover:text-white/90 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-transparent after:transition-all after:duration-200 ${activeTab === "chat"
                ? "text-white font-medium after:bg-[#2D6BFF]"
                : ""
                } hover:after:bg-[#2D6BFF]/30 px-4 py-3 text-sm md:text-base`}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
          </div>
          {/* Tab content */}
          {activeTab === "overview" && (
            <div id="overview-tab" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Asset Name:</p>
                  <p className="text-[12px] text-white font-medium">
                    {token.name}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Category:</p>
                  <div className="bgTag rounded-full py-2 px-[10px] max-h-[24px] flex justify-center items-center uppercase">
                    <p className="text-[12px] font-medium text-[#2D6BFF]">
                      {formatCategory(token.assetType || "Unknown")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Network:</p>
                  <div className="flex items-center gap-2">
                    <div style={{ background: '#181a1f', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        alt="Aptos"
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTKX0VVgxldJmuDo_7lTxhnhqsTXlyTZcARQ&s"
                        style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '9999px' }}
                      />
                    </div>
                    <span className="text-white font-medium text-xs md:text-sm leading-[1.43em] tracking-[-1%]">
                      Aptos Testnet
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Time:</p>
                  <p className="text-[12px] text-white font-medium">2d ago</p>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-4 mb-2">
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Total Supply:</p>
                  <p className="text-[12px] text-white font-medium">
                    {formatNumberCompact(token.totalSupply)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">
                    Circulating Supply:
                  </p>
                  <p className="text-[12px] text-white font-medium">
                    {formatNumberCompact(token.circulatingSupply)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Market Cap:</p>
                  <p className="text-[12px] text-white font-medium">
                    {formatNumberCompact(token.marketCap)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[12px] text-[#7E7E7E]">Holders count:</p>
                  <p className="text-[12px] text-white font-medium">1</p>
                </div>
              </div>
              {/* TradingView Chart Widget - Now showing APTOS (APTUSDT) data. */}
              <div className="w-full" style={{ height: "480px" }}>
                <div className="h-full bg-[#181a1f] rounded-xl border border-[#313131] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-full text-center py-2">
                    <span className="text-white/70 text-sm font-medium">
                      This chart displays Aptos (APTUSDT) data from TradingView.
                      Real system data will be integrated in future updates.
                    </span>
                  </div>
                  <iframe
                    src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_12345&symbol=BINANCE:APTUSDT&interval=30&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1&hidevolume=1&hidelegend=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en"
                    style={{
                      width: "100%",
                      height: "420px",
                      border: "none",
                      borderRadius: "12px",
                    }}
                    allowFullScreen
                    title="TradingView Chart"
                  ></iframe>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs font-medium bg-[#181a1f]/80 px-2 py-1 rounded">
                    TradingView Chart (Symbol: APTUSDT)
                  </span>
                </div>
              </div>
            </div>
          )}
          {activeTab === "history" && (
            <div
              id="history-tab"
              className="w-full min-h-[200px] bg-[#181a1f] rounded-xl flex items-center justify-center text-white/40 text-lg font-medium border border-[#313131]"
            >
              Trade History Placeholder
            </div>
          )}
          {activeTab === "chat" && (
            <div
              id="chat-tab"
              className="w-full min-h-[200px] bg-[#181a1f] rounded-xl flex items-center justify-center text-white/40 text-lg font-medium border border-[#313131]"
            >
              Chat Placeholder
            </div>
          )}
        </div>
      </div>
      {/* Right/Sidebar section */}
      <div className="lg:col-span-1 space-y-4 md:space-y-6">
        {/* Price, Mcap, Volume */}
        <div className="bg-[#181a1f] shadowInput rounded-xl border">
          <div className="border-b border-b-[#313131] flex items-center">
            {/* PRICE */}
            <div className="flex flex-col w-full p-3 h-full border-r-2 border-r-[#313131] items-start justify-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[12px] font-normal text-white/60 uppercase">
                  Price
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#E5E7EB"
                    fontFamily="Arial"
                  >
                    $
                  </text>
                </svg>
              </div>
              <div className="text-[22px] font-medium text-white">
                <span>{formatNumberCompact(token.currentPriceUsd)}</span>
              </div>
            </div>
            {/* MCAP */}
            <div className="flex flex-col w-full p-3 h-full border-r-2 border-r-[#313131] items-start justify-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[12px] font-normal text-white/60 uppercase">
                  Mcap
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#E5E7EB"
                    fontFamily="Arial"
                  >
                    $
                  </text>
                  <path d="M16 8l2 2-6 6" stroke="#E5E7EB" strokeWidth="1" />
                </svg>
              </div>
              <div className="text-[22px] font-medium text-white">
                <span>{formatNumberCompact(token.marketCap)}</span>
              </div>
            </div>
            {/* VOLUME 24H */}
            <div className="flex flex-col w-full p-3 h-full items-start justify-center">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[12px] font-normal text-white/60 uppercase">
                  Volume 24h
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="10" width="3" height="8" rx="1.5" />
                  <rect x="9" y="6" width="3" height="12" rx="1.5" />
                  <rect x="15" y="13" width="3" height="5" rx="1.5" />
                </svg>
              </div>
              <div className="text-[22px] font-medium text-white">
                <span>0.00</span>
              </div>
            </div>
          </div>
          {/* Buy/Sell UI */}
          <div className="flex flex-col gap-4 p-4">
            {/* Buy/Sell Tabs */}
            <div className="flex bg-[#181a1f] rounded-lg p-1 mb-2 border">
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${buyingTab === "buy"
                  ? "bg-[#4BD467] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
                  }`}
                onClick={() => setBuyingTab("buy")}
                disabled={buyingTab === "buy"}
              >
                Buy
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${buyingTab === "sell"
                  ? "bg-[#F75C5E] text-white shadow-sm"
                  : "text-white/60 hover:text-white"
                  }`}
                onClick={() => setBuyingTab("sell")}
                disabled={buyingTab === "sell"}
              >
                Sell
              </button>
            </div>
            {/* Buy Tab Content */}
            {buyingTab === "buy" && (
              <>
                <div className="flex justify-between items-center gap-3 relative">
                  <input
                    placeholder="0.0"
                    className="rounded-none text-foreground placeholder:text-muted-foreground focus-visible:!shadow-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-transparent truncate w-full bg-transparent border-0 text-[32px] p-0 leading-tight focus:outline-none tracking-[-2%] font-medium"
                    type="text"
                    value={buyAmount}
                    inputMode="numeric"
                    onChange={(e) => setBuyAmount(e.target.value)}
                    disabled={buying}
                  />
                  <div className="flex flex-col gap-2 min-w-[140px] justify-end items-end">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-medium text-white">1%</p>
                      <p className="uppercase text-[12px] cursor-pointer font-normal underline text-primary">
                        Set max slippage
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-normal text-white">
                        {token.symbol}
                      </p>
                      <img
                        width="20"
                        height="20"
                        crossOrigin="anonymous"
                        className="rounded-full"
                        alt=""
                        src={token.iconUrl || "/firestarter-nativetoken.png"}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-[12px] font-normal text-white/60">
                    Balance:{" "}
                  </div>
                  <div className="text-[12px] font-normal text-white">
                    <div className="text-[12px] font-normal text-white">
                      {aptosInWalletUser} APTOS
                    </div>
                  </div>
                </div>
                <div className="flex items-center pb-3 gap-[6px]">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleBuyQuickAmount("reset")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[40px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      Reset
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleBuyQuickAmount("0.1")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      0.1 {token.symbol}
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleBuyQuickAmount("0.2")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      0.2 {token.symbol}
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleBuyQuickAmount("0.5")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      0.5 {token.symbol}
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleBuyQuickAmount("max")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      MAX
                    </p>
                  </button>
                </div>
                <button
                  type="button"
                  className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none px-4 min-w-20 gap-2 transition-transform-colors-opacity motion-reduce:transition-none w-full text-center hover:opacity-85 h-12 rounded-full text-white font-medium border-b-2 transition-transform active:scale-[98%] text-base bg-[#4BD467] border-[#27AC4B]"
                  style={{
                    boxShadow: "rgba(54, 253, 81, 0.44) 0px 3px 0px 0px",
                  }}
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? "Sending…" : "Buy"}
                </button>
              </>
            )}
            {/* Sell Tab Content */}
            {buyingTab === "sell" && (
              <>
                <div className="flex justify-between items-center gap-3 relative">
                  <input
                    placeholder="0.0"
                    className="rounded-none text-foreground placeholder:text-muted-foreground focus-visible:!shadow-none focus-visible:ring-0 focus-visible:outline-none focus-visible:ring-offset-0 focus-visible:ring-transparent truncate w-full bg-transparent border-0 text-[32px] p-0 leading-tight focus:outline-none tracking-[-2%] font-medium"
                    type="text"
                    value={sellAmount}
                    inputMode="numeric"
                    onChange={(e) => setSellAmount(e.target.value)}
                    disabled={selling}
                  />
                  <div className="flex flex-col gap-2 min-w-[140px] justify-end items-end">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-medium text-white">1%</p>
                      <p className="uppercase text-[12px] cursor-pointer font-normal underline text-primary">
                        Set max slippage
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-normal text-white">
                        {token.symbol}
                      </p>
                      <img
                        width="20"
                        height="20"
                        crossOrigin="anonymous"
                        className="rounded-full"
                        alt=""
                        src={token.iconUrl || "/firestarter-nativetoken.png"}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="text-[12px] font-normal text-white/60">
                    Balance:{" "}
                  </div>
                  <div className="text-[12px] font-normal text-white">
                    <div className="text-[12px] font-normal text-white">
                      {userTokenBalance} {token.symbol}
                    </div>
                  </div>
                </div>
                <div className="flex items-center pb-3 gap-[6px]">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleSellQuickAmount("reset")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[40px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      Reset
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleSellQuickAmount("0.1")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      0.1 {token.symbol}
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleSellQuickAmount("0.2")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      0.2 {token.symbol}
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleSellQuickAmount("0.5")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      0.5 {token.symbol}
                    </p>
                  </button>
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={() => handleSellQuickAmount("max")}
                    className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none h-8 text-xs gap-1 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground bg-[#181a1f] min-w-[48px] px-2 max-h-[24px] rounded-2xl"
                  >
                    <p className="text-[11px] font-normal uppercase text-[#FFFFFF8F]">
                      MAX
                    </p>
                  </button>
                </div>
                <button
                  type="button"
                  className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none px-4 min-w-20 gap-2 transition-transform-colors-opacity motion-reduce:transition-none w-full text-center hover:opacity-85 h-12 rounded-full text-white font-medium border-b-2 transition-transform active:scale-[98%] text-base bg-[#F75C5E] border-[#D73B3E]"
                  style={{
                    boxShadow: "rgba(253, 54, 81, 0.44) 0px 3px 0px 0px",
                  }}
                  onClick={handleSell}
                  disabled={selling}
                >
                  {selling ? "Sending…" : "Sell"}
                </button>
              </>
            )}
          </div>
        </div>
        {/* Trust Score */}
        <div className="bg-[#181a1f] shadowInput rounded-xl border p-3">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="text-white text-lg font-medium">
                <div>Current Trust Score</div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-info w-4 h-4 text-white/60"
                tabIndex={0}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="text-6xl font-bold text-[#4BD467]">
                {issuerScore !== null ? (
                  issuerScore
                ) : (
                  <span className="text-white/40 text-2xl">...</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-white/60 text-base">
                  {issuerScore !== null
                    ? issuerScore >= 80
                      ? "Excellent"
                      : issuerScore >= 50
                        ? "Good"
                        : issuerScore >= 20
                          ? "Risky"
                          : "New"
                    : ""}
                </span>
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-white">
                  Basic Tier
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img
                alt={token.creator}
                className="size-[24px] rounded-md object-cover w-6 h-6"
                crossOrigin="anonymous"
                src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${token.creator}&scale=70`}
              />
              <span
                className="text-white font-medium text-xs md:text-sm tracking-[-0.02em] leading-[1.5em] cursor-pointer hover:underline"
                onClick={() => handleCopy(token.creator, "trust-creator")}
                title="Sao chép địa chỉ creator"
              >
                {token.creator.slice(0, 4)}...{token.creator.slice(-3)}
              </span>
              <div className="relative flex items-center">
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => handleCopy(token.creator, "trust-creator")}
                  className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap font-normal subpixel-antialiased overflow-hidden tap-highlight-transparent transform-gpu outline-none text-tiny gap-2 rounded-full px-0 !gap-0 transition-transform-colors-opacity motion-reduce:transition-none text-default-foreground min-w-8 bg-[#313131] h-[32px] w-[32px] transition-colors border border-white/20 hover:bg-[#181a1f] active:scale-95"
                  title="Sao chép địa chỉ creator"
                >
                  {copiedKey === "trust-creator" ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="w-4 h-4 text-green-400"
                    >
                      <path
                        d="M5 10.5l4 4 6-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="w-4 h-4 text-white/64"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="12"
                        height="12"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8 8h4v4H8z"
                        fill="currentColor"
                        fillOpacity=".3"
                      />
                    </svg>
                  )}
                </button>
                {copiedKey === "trust-creator" && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#181a1f] text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-10">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Progress Bar Section */}
        <div className="bg-[#181a1f] rounded-3xl overflow-hidden border shadowInput p-4">
          {(() => {
            const threshold = Number(token.graduationThreshold);
            const target = Number(token.graduationTarget);
            const reserve = Number(token.reserve);
            let progress = 0;
            let progressText = "0%";
            if (
              !isNaN(threshold) &&
              !isNaN(target) &&
              !isNaN(reserve) &&
              target > threshold
            ) {
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
            // Blue color palette
            const barFrom = "#2D6BFF";
            const barTo = "#00C6FB";
            const glow1 =
              "linear-gradient(90deg, rgba(45,107,255,0) 0%, #2D6BFF 77%, #00C6FB 100%)";
            const glow2 =
              "linear-gradient(90deg, rgba(45,107,255,0) 0%, #2D6BFF 77%, #B2E6FF 100%)";
            return (
              <>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    {/* Icon for progress */}
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <circle
                        cx="10"
                        cy="10"
                        r="9"
                        stroke="#2D6BFF"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M10 5v5l3 3"
                        stroke="#2D6BFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-white font-normal text-sm md:text-base">
                      Bonding Curve Progress
                    </span>
                  </div>
                  <span className="text-[#2D6BFF] font-semibold text-base md:text-lg">
                    {progressText}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="relative h-[12px] md:h-[16px] w-full mb-2">
                  <div className="flex items-center absolute top-0 left-0 right-0 w-full h-full">
                    {/* Use grid to make bars fill the container exactly */}
                    <div className="grid grid-cols-30 gap-[3px] md:gap-1 w-full h-full">
                      {[...Array(30)].map((_, i) => {
                        const percent = i / 29;
                        const filled = percent <= progress;
                        return (
                          <div
                            key={i}
                            className={`h-[12px] md:h-[16px] rounded-full transition-colors duration-200 ${filled
                              ? "bg-gradient-to-r from-[#2D6BFF] to-[#00C6FB]"
                              : "bg-[#212121]"
                              } w-full`}
                          ></div>
                        );
                      })}
                    </div>
                    {/* Glow at the end of the last filled bar */}
                    {!belowThreshold &&
                      progress > 0 &&
                      (() => {
                        // Find the last filled bar index
                        const lastFilled = Math.floor(progress * 29);
                        // Calculate left position as a percentage of the bar
                        const leftPercent = ((lastFilled + 1) / 30) * 100;
                        return (
                          <>
                            <div
                              className="absolute h-[12px] md:h-[16px] rounded-full pointer-events-none"
                              style={{
                                left: `${leftPercent}%`,
                                width: "23.8px",
                                transform: "translateX(-100%)",
                                background: glow1,
                                filter: "blur(4px)",
                                opacity: 0.8,
                              }}
                            ></div>
                            <div
                              className="absolute h-[12px] md:h-[16px] rounded-full pointer-events-none"
                              style={{
                                left: `${leftPercent}%`,
                                width: "17.8px",
                                transform: "translateX(-100%)",
                                background: glow2,
                                filter: "blur(8px)",
                                opacity: 0.9,
                              }}
                            ></div>
                          </>
                        );
                      })()}
                  </div>
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  {token.totalSupply && token.circulatingSupply && (
                    <>
                      <p className="text-xs font-normal text-[#FFFFFF8C]">
                        This token will only be listed on the DEX after{" "}
                        <span className="text-white/80 font-semibold">80%</span>{" "}
                        of its total supply is sold on the platform.
                      </p>
                      <p className="text-xs font-normal text-[#FFFFFF8C]">
                        For example, if the total supply is{" "}
                        <span className="text-white/80 font-semibold">
                          {formatNumberCompact(token.totalSupply)}{" "}
                          {token.symbol}
                        </span>
                        , then{" "}
                        <span className="text-white/80 font-semibold">
                          {formatNumberCompact(token.circulatingSupply)}{" "}
                          {token.symbol}
                        </span>{" "}
                        must be sold before it moves to the DEX.
                      </p>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
        {/* Holder Distribution */}
        <div className="bg-[#181a1f] rounded-3xl p-4 shadowInput border">
          <div className="flex flex-col gap-2 mb-3 md:mb-4">
            <h3 className="text-white font-semibold text-base">
              Holder Distribution
            </h3>
            {token.circulatingSupply && token.totalSupply ? (
              <p className="text-[12px] font-normal text-[#7E7E7E]">
                {formatNumberCompact(token.circulatingSupply)} /{" "}
                {formatNumberCompact(token.totalSupply)} circulating
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 md:py-4 rounded-[12px] border-t-1 border-t-[#313131]">
              <div className="flex items-center gap-2 md:gap-2">
                {/* Holder icon */}
                <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-medium bg-gradient-to-r from-[#2D6BFF] to-[#00C6FB] shadow-[0px_3px_0px_0px_rgba(45,107,255,0.44)] border border-white/25 text-white">
                  <svg width="18" height="18" fill="none" viewBox="0 0 18 18">
                    <circle
                      cx="9"
                      cy="9"
                      r="8"
                      stroke="#fff"
                      strokeWidth="1.5"
                      fill="#2D6BFF"
                    />
                    <path
                      d="M9 5.5a2 2 0 110 4 2 2 0 010-4zm0 5c-2.21 0-4 1.12-4 2.5V14h8v-1.5c0-1.38-1.79-2.5-4-2.5z"
                      fill="#fff"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex flex-col items-center md:flex-row md:gap-1">
                    {/* Creator icon */}
                    <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="16" fill="#2D6BFF" />
                      <path
                        d="M16 10a3 3 0 110 6 3 3 0 010-6zm0 8c-3.31 0-6 1.68-6 3.75V24h12v-2.25C22 19.68 19.31 18 16 18z"
                        fill="#fff"
                      />
                    </svg>
                    <span className="text-sm md:text-base text-[#A7A7A7] font-medium cursor-pointer hover:text-white transition-colors">
                      {token.creator
                        ? token.creator.slice(0, 4) +
                        "..." +
                        token.creator.slice(-3)
                        : ""}
                    </span>
                    <div className="flex gap-1 mt-1 ml-1 md:mt-0">
                      <div className="inline-flex items-center uppercase font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bgDev text-[#2D6BFF] hover:bg-[#0E0E0E] border border-[#2D6BFF]/50 rounded-full text-xs px-2 md:px-3 py-0.5">
                        Creator
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Tính phần trăm holder nếu có dữ liệu */}
              {token.circulatingSupply &&
                token.totalSupply &&
                !isNaN(Number(token.circulatingSupply)) &&
                !isNaN(Number(token.totalSupply)) ? (
                <span className="text-sm md:text-base text-white font-semibold">
                  {(
                    (Number(token.circulatingSupply) /
                      Number(token.totalSupply)) *
                    100
                  ).toFixed(2)}
                  %
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}