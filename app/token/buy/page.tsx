"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { toast } from "@/hooks/use-toast";

// Contract info (update to your deployed address)
const CONTRACT_ADDRESS = "0x789aebdecec5bc128a2146e2b5b4b9c4111ad0b48c065ab1cd96871e20ac3e97";
const MODULE_NAME = "fa_factory";

import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

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

export default function BuyTokenPage() {
    const connectedWallet = useConnectedWallet();
    const { safeSignAndSubmitTransaction } = useSafeWallet();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyAmounts, setBuyAmounts] = useState<{ [symbol: string]: string }>({});
    const [buying, setBuying] = useState<string | null>(null);


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
                    console.log('Token iconUrl:', iconUrl, 'for symbol:', decodeHexStringSafe(fullInfo[0]));
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

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Mua Token từ Contract</h1>
            {loading ? (
                <div>Đang tải danh sách token...</div>
            ) : tokens.length === 0 ? (
                <div>Không có token nào trên contract.</div>
            ) : (
                <div className="space-y-6">
                    {tokens.map(token => (
                        <Card key={token.symbol}>
                            <CardHeader>
                                <CardTitle>{token.name} ({token.symbol})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        {token.iconUrl && (
                                            <img src={token.iconUrl} alt={token.symbol} style={{ width: 48, height: 48, borderRadius: 8, marginBottom: 8 }} />
                                        )}
                                        <div><b>Creator:</b> {token.creator}</div>
                                        <div><b>Decimals:</b> {token.decimals}</div>
                                        <div><b>Project:</b> <a href={token.projectUrl} target="_blank" rel="noopener noreferrer">{token.projectUrl}</a></div>
                                        <div><b>Description:</b> {token.description}</div>
                                        <div><b>Total Supply:</b> {token.totalSupply}</div>
                                        <div><b>Circulating Supply:</b> {token.circulatingSupply}</div>
                                        <div><b>k:</b> {token.k}</div>
                                        <div><b>Fee Rate:</b> {token.feeRate}</div>
                                        <div><b>Asset Type:</b> {token.assetType}</div>
                                        <div><b>Backing Ratio:</b> {token.backingRatio}</div>
                                        <div><b>Withdrawal Limit:</b> {token.withdrawalLimit}</div>
                                        <div><b>Withdrawal Cooldown:</b> {token.withdrawalCooldown}</div>
                                        <div><b>Graduation Threshold:</b> {token.graduationThreshold}</div>
                                        <div><b>Graduation Target:</b> {token.graduationTarget}</div>
                                        <div><b>Is Graduated:</b> {token.isGraduated ? "Yes" : "No"}</div>
                                        <div><b>Oracle Price:</b> {token.oraclePrice}</div>
                                        <div><b>Reserve:</b> {token.reserve}</div>
                                        <div><b>Current Price (APT):</b> {token.currentPriceApt}</div>
                                        <div><b>Current Price (USD):</b> {token.currentPriceUsd}</div>
                                        <div><b>Liquidity (APT):</b> {token.liquidity}</div>
                                        <div><b>Market Cap (APT):</b> {token.marketCap}</div>
                                        <div><b>Sale Status:</b> {token.saleStatus}</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label>Số APT (octas):</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={buyAmounts[token.symbol] || ""}
                                            onChange={e => setBuyAmounts(a => ({ ...a, [token.symbol]: e.target.value }))}
                                            placeholder="Nhập số octas"
                                        />
                                        <Button
                                            onClick={() => handleBuy(token)}
                                            disabled={buying === token.symbol}
                                        >
                                            {buying === token.symbol ? "Đang mua..." : `Mua ${token.symbol}`}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
