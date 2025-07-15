"use client";

import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
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


export default function TokenDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [token, setToken] = useState<TokenInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchToken() {
            setLoading(true);
            try {
                // Find token by symbol from params
                const symbol = params?.address;
                // You may want to fetch all events and find the right creator for this symbol
                const events = await aptos.getModuleEventsByEventType({
                    eventType: `${CONTRACT_ADDRESS}::${MODULE_NAME}::TokenCreated`,
                    minimumLedgerVersion: 0,
                });
                let found = null;
                for (let i = 0; i < events.length; i++) {
                    const event = events[i];
                    const eventData = event.data;
                    const decodedSymbol = decodeHexString(eventData.symbol);
                    if (decodedSymbol === symbol) {
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
                        found = {
                            symbol: decodeHexStringSafe(fullInfo[0]),
                            name: decodeHexStringSafe(fullInfo[1]),
                            decimals: Number(fullInfo[2] ?? 6),
                            iconUrl: decodeHexStringSafe(fullInfo[3]),
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
                        };
                        break;
                    }
                }
                setToken(found);
            } catch (e) {
                setToken(null);
            } finally {
                setLoading(false);
            }
        }
        fetchToken();
    }, [params]);

    if (loading) return <div className="container py-10">Loading...</div>;
    if (!token) return <div className="container py-10">Token not found.</div>;

    return (
        <div className="container space-y-6 pt-24 mb-10 px-4 md:px-6 max-w-[1380px]">
            <div className="flex items-center gap-3">
                <span className="text-[#7E7E7E] text-[14px] font-medium cursor-pointer opacity-80" onClick={() => router.push('/token/buy')}>Explore</span>
                <span className="text-[#7E7E7E] text-[14px] font-medium">/</span>
                <span className="text-white text-[14px] font-medium">Asset Details</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                    <div className="w-full rounded-xl h-max overflow-hidden bg-[#1A1A1A] border-2 border-white/5 shadow-[0px_4px_0px_0px_rgba(255,255,255,0.05)]">
                        <div className="flex items-stretch p-3 gap-6">
                            <div className="flex flex-col gap-2.5">
                                <div className="relative w-[140px] h-[140px] border border-white/20 bg-white/5 p-2 rounded-2xl">
                                    <img alt={token.name} className="size-[132] object-cover rounded-[12px]" src={token.iconUrl || "/graphics/hero-eclipse.svg"} />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="flex flex-col gap-4 justify-between h-full">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex  gap-x-2 justify-between">
                                            <h1 className="text-[24px] font-bold text-white line-clamp-1 ">{token.name}</h1>
                                            <div className="bg-[#292828] rounded-full max-h-8 py-2 pl-4 flex items-center gap-2 justify-between">
                                                <div className="flex items-center gap-1 text-white text-sm font-normal">
                                                    <span className="font-medium  whitespace-nowrap">Token address:</span>
                                                    <span>{token.creator.slice(0, 5)}...{token.creator.slice(-3)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[24px] font-normal text-white">${token.symbol}</span>
                                            </div>
                                        </div>
                                        <p className="text-[14px] font-normal text-[#9FA3A0]">{token.description}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#7E7E7E] text-[12px] font-normal">Created by:</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-[22px] h-[22px] rounded-full bg-[#70584B] flex items-center justify-center">
                                                        <img alt="" className="w-[22px] h-[22px] rounded-full" src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${token.creator}&scale=70`} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white text-[14px] font-normal" tabIndex={0}>{token.creator.slice(0, 5)}...{token.creator.slice(-3)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#7E7E7E] text-[12px] font-normal">Created Date:</span>
                                                <img width="22" height="22" alt="" src="/icons/ic-time.svg" />
                                                <span className="text-white text-[14px] font-medium">-</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 cursor-pointer">
                                            <div tabIndex={0}><svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/64"><path fillRule="evenodd" clipRule="evenodd" d="M8.7574 2.83328C8.7574 1.2685 10.0317 0 11.6036 0C13.1755 0 14.4497 1.2685 14.4497 2.83328C14.4497 4.39806 13.1755 5.66656 11.6036 5.66656C10.8098 5.66656 10.0925 5.34296 9.57684 4.82236L5.63681 7.50497C5.67324 7.68596 5.69231 7.87293 5.69231 8.06395C5.69231 8.44221 5.61757 8.80376 5.48204 9.13423L9.80229 11.9727C10.2926 11.5734 10.92 11.3331 11.6036 11.3331C13.1755 11.3331 14.4497 12.6016 14.4497 14.1664C14.4497 15.7312 13.1755 16.9997 11.6036 16.9997C10.0317 16.9997 8.7574 15.7312 8.7574 14.1664C8.7574 13.7565 8.84513 13.3664 9.00279 13.0142L4.71747 10.1987C4.21758 10.6332 3.56279 10.8972 2.84616 10.8972C1.27427 10.8972 0 9.62872 0 8.06395C0 6.49917 1.27427 5.23067 2.84616 5.23067C3.75005 5.23067 4.55466 5.65006 5.07563 6.30278L8.89416 3.70289C8.80534 3.42849 8.7574 3.1361 8.7574 2.83328Z" fill="white" fillOpacity="0.64"></path></svg></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Tabs and Overview/History/Chat content can be added here */}
                </div>
                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                    <div className="bg-[#181818] shadowInput rounded-xl border">
                        <div className="border-b border-b-[#313131] flex items-center">
                            <div className="flex flex-col gap-2 w-full p-3 h-full border-r-2 border-r-[#313131]">
                                <div className="flex justify-between items-center"><p className="text-[12px] font-normal text-white/60 uppercase">Price</p><img width="20" height="20" alt="" src="/icons/ic-dollar-circle.svg" /></div>
                                <div className="text-[22px] font-medium text-white"><span>{token.currentPriceApt}</span></div>
                            </div>
                            <div className="flex flex-col gap-2 w-full p-3 border-r-2 border-r-[#313131] h-full">
                                <div className="flex justify-between items-center"><p className="text-[12px] font-normal text-white/60 uppercase">Mcap</p><img width="20" height="20" alt="" src="/icons/ic-money-send.svg" /></div>
                                <p className="md:text-[22px] text-[16px] font-medium text-white">{token.marketCap}</p>
                            </div>
                            <div className="flex flex-col gap-2 w-full p-3 h-full">
                                <div className="flex justify-between items-center"><p className="text-[12px] font-normal text-white/60 uppercase">Volume 24h</p><img width="20" height="20" alt="" src="/icons/ic-bar-chart.svg" /></div>
                                <p className="md:text-[22px] text-[16px] font-medium text-white">0.00</p>
                            </div>
                        </div>
                        {/* Buy/Sell UI, input, quick buttons, etc. can be added here */}
                    </div>
                    {/* Bonding curve progress, holder distribution, etc. can be added here */}
                </div>
            </div>
        </div>
    );
}
