"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";

import { toast } from "@/hooks/use-toast";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";

const CONTRACT_ADDRESS = "0x9ff9d0f7bcbba328160813c609edf2d6bfd19cb0648ccb0ed5954f35c7d877e6";
const MODULE_NAME = "fa_factory";

interface TokenFormData {
    symbol: string;
    name: string;
    iconUrl: string;
    projectUrl: string;
    decimals: number;
    totalSupply: string;
    k: string;
    feeRate: string;
    assetType: string;
    backingRatio: string;
    withdrawalLimit: string;
    withdrawalCooldown: string;
    graduationThreshold: string;
    graduationTarget: string;
}

export default function CreateTokenAndBuyForm() {
    const connectedWallet = useConnectedWallet();
    const safeWallet = useSafeWallet();
    const [formData, setFormData] = useState<TokenFormData>({
        symbol: "TEST",
        name: "Test Token",
        iconUrl: "https://example.com/icon.png",
        projectUrl: "https://example.com",
        decimals: 8,
        totalSupply: "1000000000000000",
        k: "100",
        feeRate: "300",
        assetType: "REAL_ESTATE",
        backingRatio: "5000",
        withdrawalLimit: "1000",
        withdrawalCooldown: "86400",
        graduationThreshold: "100000000",
        graduationTarget: "1000000000",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [buyData, setBuyData] = useState({
        creator: "49156ab889c0d8bee761f8aa526457a40bebbe7bae6138ab12fabe1e22d81019",
        symbol: "TEST",
        amount: "50000000", // 0.5 APT in octas
    });
    const [isBuying, setIsBuying] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleBuyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBuyData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Encode string params as vector<u8>
            const encode = (s: string) => Array.from(new TextEncoder().encode(s));
            const payload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_token`,
                type_arguments: [],
                arguments: [
                    encode(formData.symbol),
                    encode(formData.name),
                    encode(formData.iconUrl),
                    encode(formData.projectUrl),
                    formData.decimals,
                    formData.totalSupply,
                    formData.k,
                    formData.feeRate,
                    encode(formData.assetType),
                    formData.backingRatio,
                    formData.withdrawalLimit,
                    formData.withdrawalCooldown,
                    formData.graduationThreshold,
                    formData.graduationTarget,
                ],
            };
            const response = await safeWallet.safeSignAndSubmitTransaction(payload);
            toast({ title: "Token Created!", description: `Tx Hash: ${response?.hash}` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBuying(true);
        try {
            const encode = (s: string) => Array.from(new TextEncoder().encode(s));
            const payload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                type_arguments: [],
                arguments: [
                    buyData.creator,
                    encode(buyData.symbol),
                    buyData.amount,
                ],
            };
            const response = await safeWallet.safeSignAndSubmitTransaction(payload);
            toast({ title: "Buy Success!", description: `Tx Hash: ${response?.hash}` });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsBuying(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Tạo Token mới (chuẩn contract mới)</h1>
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <form onSubmit={handleCreateToken} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Symbol*</Label><Input name="symbol" value={formData.symbol} onChange={handleInputChange} required /><p className="text-xs">Symbol: TEST</p></div>
                            <div><Label>Name*</Label><Input name="name" value={formData.name} onChange={handleInputChange} required /><p className="text-xs">Name: Test Token</p></div>
                            <div><Label>Icon URL*</Label><Input name="iconUrl" value={formData.iconUrl} onChange={handleInputChange} required /><p className="text-xs">Icon URL: https://example.com/icon.png</p></div>
                            <div><Label>Project URL*</Label><Input name="projectUrl" value={formData.projectUrl} onChange={handleInputChange} required /><p className="text-xs">Project URL: https://example.com</p></div>
                            <div><Label>Decimals*</Label><Input name="decimals" type="number" value={formData.decimals} onChange={handleInputChange} required /><p className="text-xs">Decimals: 8</p></div>
                            <div><Label>Total Supply*</Label><Input name="totalSupply" value={formData.totalSupply} onChange={handleInputChange} required /><p className="text-xs">Total Supply: 1000000000000000</p></div>
                            <div><Label>K (bonding curve)*</Label><Input name="k" value={formData.k} onChange={handleInputChange} required /><p className="text-xs">K: 100</p></div>
                            <div><Label>Fee Rate*</Label><Input name="feeRate" value={formData.feeRate} onChange={handleInputChange} required /><p className="text-xs">Fee Rate: 300 (3%)</p></div>
                            <div><Label>Asset Type*</Label><Input name="assetType" value={formData.assetType} onChange={handleInputChange} required /><p className="text-xs">Asset Type: REAL_ESTATE</p></div>
                            <div><Label>Backing Ratio*</Label><Input name="backingRatio" value={formData.backingRatio} onChange={handleInputChange} required /><p className="text-xs">Backing Ratio: 5000 (50%)</p></div>
                            <div><Label>Withdrawal Limit*</Label><Input name="withdrawalLimit" value={formData.withdrawalLimit} onChange={handleInputChange} required /><p className="text-xs">Withdrawal Limit: 1000 (10%)</p></div>
                            <div><Label>Withdrawal Cooldown*</Label><Input name="withdrawalCooldown" value={formData.withdrawalCooldown} onChange={handleInputChange} required /><p className="text-xs">Withdrawal Cooldown: 86400 (1 day)</p></div>
                            <div><Label>Graduation Threshold*</Label><Input name="graduationThreshold" value={formData.graduationThreshold} onChange={handleInputChange} required /><p className="text-xs">Graduation Threshold: 100000000</p></div>
                            <div><Label>Graduation Target*</Label><Input name="graduationTarget" value={formData.graduationTarget} onChange={handleInputChange} required /><p className="text-xs">Graduation Target: 1000000000</p></div>
                        </div>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Đang tạo..." : "Tạo Token"}</Button>
                    </form>
                </CardContent>
            </Card>

            <h2 className="text-xl font-bold mb-4">Mua Token (chuẩn contract mới)</h2>
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleBuyToken} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><Label>Creator Address*</Label><Input name="creator" value={buyData.creator} onChange={handleBuyInputChange} required /><p className="text-xs">Địa chỉ creator</p></div>
                            <div><Label>Symbol*</Label><Input name="symbol" value={buyData.symbol} onChange={handleBuyInputChange} required /><p className="text-xs">Symbol: TEST</p></div>
                            <div><Label>Số APT (octas)*</Label><Input name="amount" value={buyData.amount} onChange={handleBuyInputChange} required /><p className="text-xs">Số APT: 0.5 APT = 50000000 octas</p></div>
                        </div>
                        <Button type="submit" disabled={isBuying}>{isBuying ? "Đang mua..." : "Mua Token"}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
