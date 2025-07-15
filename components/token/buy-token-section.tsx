'use client';
import React, { useState, useEffect, useCallback } from "react";
import TokenTabs from "@/components/token/token-tab";
import TokenToolbar from "@/components/token/token-tool-bar";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { toast } from "@/hooks/use-toast";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const CONTRACT_ADDRESS = "0x789aebdecec5bc128a2146e2b5b4b9c4111ad0b48c065ab1cd96871e20ac3e97";
const MODULE_NAME = "fa_factory";

const aptosConfig = new AptosConfig({
    network: Network.TESTNET,
    clientConfig: {
        API_KEY: "AG-9W2L7VUVYZ8VCUMYY8VMRVMICKYNYC68H"
    }
});
const aptos = new Aptos(aptosConfig);

function decodeHexString(hexString: string | undefined | null): string {
    try {
        if (!hexString || typeof hexString !== 'string' || !hexString.startsWith('0x')) return hexString || '';
        const hex = hexString.slice(2);
        let result = '';
        for (let i = 0; i < hex.length; i += 2) {
            const byte = parseInt(hex.substr(i, 2), 16);
            if (byte > 0) result += String.fromCharCode(byte);
        }
        return result;
    } catch {
        return hexString || '';
    }
}

function decodeHexStringSafe(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return decodeHexString(val);
    if (val.type === 'string' && typeof val.value === 'string') return decodeHexString(val.value);
    return '';
}

function toStringSafe(val: any): string {
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return val.toString();
    if (typeof val === 'object' && 'value' in val) return String(val.value);
    if (typeof val.toString === 'function') return val.toString();
    return '';
}

interface TokenInfo {
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

export default function BuyTokenSection() {
    const connectedWallet = useConnectedWallet();
    const { safeSignAndSubmitTransaction } = useSafeWallet();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyAmounts, setBuyAmounts] = useState<{ [symbol: string]: string }>({});
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
            const tokens: TokenInfo[] = [];
            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                try {
                    const eventData = event.data as any;
                    let creatorAddress = eventData.creator;
                    if (event.transaction_version && (!creatorAddress || creatorAddress.includes('0000'))) {
                        try {
                            const txnDetails = await aptos.getTransactionByVersion({
                                ledgerVersion: event.transaction_version
                            });
                            if (txnDetails && 'sender' in txnDetails) {
                                creatorAddress = txnDetails.sender;
                            }
                        } catch { }
                    }
                    if (!creatorAddress || creatorAddress.includes('0000')) continue;
                    const decodedSymbol = decodeHexString(eventData.symbol);
                    // Call get_full_token_info view function
                    let fullInfo;
                    try {
                        fullInfo = await aptos.view({
                            payload: {
                                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_full_token_info`,
                                typeArguments: [],
                                functionArguments: [creatorAddress, Array.from(new TextEncoder().encode(decodedSymbol))]
                            }
                        });
                    } catch (e) {
                        continue;
                    }
                    if (!fullInfo || !Array.isArray(fullInfo) || fullInfo.length < 25) continue;
                    const iconUrl = decodeHexStringSafe(fullInfo[3]);
                    tokens.push({
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
            setTokens(tokens);
        } catch (e) {
            toast({ title: "Error", description: "Failed to fetch tokens", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTokens(); }, [fetchTokens]);

    const handleBuy = async (token: TokenInfo) => {
        if (!connectedWallet.connected || !connectedWallet.account) {
            toast({ title: "Wallet not connected", description: "Please connect your wallet.", variant: "destructive" });
            return;
        }
        const amount = buyAmounts[token.symbol];
        if (!amount || parseFloat(amount) <= 0) {
            toast({ title: "Invalid amount", description: "Enter amount to buy.", variant: "destructive" });
            return;
        }
        setBuying(token.symbol);
        try {
            const symbolBytes = Array.from(new TextEncoder().encode(token.symbol));
            const payload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                type_arguments: [],
                arguments: [
                    token.creator,
                    symbolBytes,
                    buyAmounts[token.symbol],
                ],
            };
            let response;
            // Try wallet adapter first
            if (connectedWallet.wallet && typeof (connectedWallet.wallet as any).signAndSubmitTransaction === 'function') {
                try {
                    const cleanPayload = {
                        type: payload.type,
                        function: payload.function,
                        type_arguments: payload.type_arguments || [],
                        arguments: payload.arguments || []
                    };
                    response = await (connectedWallet.wallet as any).signAndSubmitTransaction({ payload: cleanPayload });
                } catch (err1) {
                    try {
                        response = await (connectedWallet.wallet as any).signAndSubmitTransaction(payload);
                    } catch (err2) {
                        response = await safeSignAndSubmitTransaction(payload);
                    }
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
                            <a href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Xem trên explorer</a>
                        )}
                    </div>
                )
            });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setBuying(null);
        }
    };

    // Filtering and sorting logic for grid UI
    const filteredTokens = tokens
        .filter(token =>
            (activeTab === "all" || token.assetType === activeTab) &&
            (search === "" || token.name.toLowerCase().includes(search.toLowerCase()) || token.symbol.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            if (sortBy === "marketCap") return Number(b.marketCap) - Number(a.marketCap);
            if (sortBy === "createdTime") return 0; // TODO: add createdTime if available
            return 0;
        });

    return (
        <div className="w-full h-full py-10 px-4 md:px-8 flex flex-col gap-6">
            {/* Tabs filter */}
            <TokenTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            {/* Toolbar: search, sort, filter buttons */}
            <TokenToolbar search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />

            {/* Token grid */}
            {loading ? (
                <div>Đang tải danh sách token...</div>
            ) : filteredTokens.length === 0 ? (
                <div>Không có token nào trên contract.</div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-3 gap-5">
                    {filteredTokens.map(token => (
                        <a
                            key={token.symbol}
                            href={`/token/buy/${token.symbol}`}
                            className="flex flex-col z-10 rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-2 cursor-pointer borderToken"
                        >
                            <div className="relative rounded-xl">
                                <img
                                    width="313"
                                    height="136"
                                    alt={token.name}
                                    className="rounded-xl min-h-[136px] max-h-[136px] object-cover w-full rounded-b-none"
                                    src={"https://png.pngtree.com/thumb_back/fw800/background/20231002/pngtree-digital-binary-code-backdrop-3d-render-of-web3-technology-image_13560192.png"}
                                />
                                <div className="absolute top-2 left-2 z-10">
                                    <div className="flex border-1 px-[10px] bg-transparent py-2 justify-center items-center max-h-[24px] rounded-full !border-[#2D6BFF66] bgStatusDeployed">
                                        <p className="text-[11px] text-[#2D6BFF] font-medium uppercase">{token.saleStatus || "Bonding"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#1A1A1A] py-[14px] px-5 rounded-xl rounded-t-none">
                                <div className="flex flex-col gap-2 border-b border-b-[#FFFFFF1A] pb-5">
                                    <p className="text-[20px] font-medium text-white line-clamp-1">{token.name}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[#707472] text-[12px] font-normal">{token.symbol}</p>
                                        <p className="text-[#707472] text-[12px] font-normal uppercase">{token.assetType}</p>
                                    </div>
                                </div>
                                <div className="pt-5 flex flex-col gap-5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[#707472] text-[12px] font-normal uppercase">Daily Volume</p>
                                            <p className="text-md font-medium text-white">${token.liquidity || '0.00'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[#707472] text-[12px] font-normal uppercase">MCap</p>
                                            <p className="text-md font-medium text-white">${token.marketCap || '0.00'}</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[#707472] text-[12px] font-normal uppercase">CREATED BY</p>
                                            <div className="flex items-center gap-[6px]">
                                                <p className="text-md font-medium text-white">{token.creator ? token.creator.slice(0, 4) + '...' + token.creator.slice(-3) : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bonding Curve Progress Bar */}
                                    {(() => {
                                        const threshold = Number(token.graduationThreshold);
                                        const target = Number(token.graduationTarget);
                                        const circulating = Number(token.circulatingSupply);
                                        let progress = 0;
                                        let progressText = "0%";
                                        if (target > threshold) {
                                            progress = (circulating - threshold) / (target - threshold);
                                            progress = Math.max(0, Math.min(1, progress));
                                            progressText = (progress * 100).toFixed(2) + "%";
                                        }
                                        const belowThreshold = circulating < threshold;
                                        return (
                                            <div className="flex flex-col gap-[6px]">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[#707472] text-[12px] font-normal">Bonding Curve Progress</p>
                                                    <p className={`text-[#2D6BFF] text-[12px] font-normal`}>{progressText}</p>
                                                </div>
                                                <div className="relative h-[12px] md:h-[16px] w-full">
                                                    <div className="flex gap-[3px] md:gap-1 items-center absolute top-0 left-0 right-0">
                                                        {[...Array(30)].map((_, i) => {
                                                            const percent = i / 29;
                                                            const filled = percent <= progress;
                                                            return (
                                                                <div
                                                                    key={i}
                                                                    className={`w-[4px] md:w-[6px] h-[12px] md:h-[16px] rounded-full transition-colors duration-200 ${filled ? 'bg-gradient-to-r from-[#2D6BFF] to-[#00C6FB]' : 'bg-[#212121]'}`}
                                                                ></div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Glow effect at progress end */}
                                                    {!belowThreshold && (
                                                        <>
                                                            <div
                                                                className="absolute h-[12px] md:h-[16px] rounded-full"
                                                                style={{ left: `${progress * 100}%`, width: '23.8px', transform: 'translateX(-100%)', background: 'linear-gradient(90deg, rgba(45,107,255,0) 0%, #2D6BFF 77%, #00C6FB 100%)', filter: 'blur(4px)', opacity: 0.8 }}
                                                            ></div>
                                                            <div
                                                                className="absolute h-[12px] md:h-[16px] rounded-full"
                                                                style={{ left: `${progress * 100}%`, width: '17.8px', transform: 'translateX(-100%)', background: 'linear-gradient(90deg, rgba(45,107,255,0) 0%, #2D6BFF 77%, #00C6FB 100%)', filter: 'blur(8px)', opacity: 0.9 }}
                                                            ></div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
