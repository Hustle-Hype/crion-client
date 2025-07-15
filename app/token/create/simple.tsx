"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { toast } from "@/hooks/use-toast";

const CONTRACT_ADDRESS = "0x9ff9d0f7bcbba328160813c609edf2d6bfd19cb0648ccb0ed5954f35c7d877e6";
const MODULE_NAME = "fa_factory";

interface TokenFormData {
    symbol: string;
    name: string;
    iconUrl: string;
    projectUrl: string;
    decimals: number;
    totalSupply: string;
    mintAmount: string;
    buyFee: string;
    assetType: string;
    backingRatio: string;
    withdrawalLimit: string;
    withdrawalCooldown: string;
    graduationThreshold: string;
    graduationTarget: string;
    description: string;
}

export default function SimpleCreateTokenPage() {
    const connectedWallet = useConnectedWallet();
    const safeWallet = useSafeWallet();
    const [formData, setFormData] = useState<TokenFormData>({
        symbol: "TEST",
        name: "Test Token",
        iconUrl: "https://example.com/icon.png",
        projectUrl: "https://example.com",
        decimals: 8,
        totalSupply: "1000000000000000",
        mintAmount: "100",
        buyFee: "300",
        assetType: "REAL_ESTATE",
        backingRatio: "5000",
        withdrawalLimit: "1000",
        withdrawalCooldown: "86400",
        graduationThreshold: "100000000",
        graduationTarget: "1000000000",
        description: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connectedWallet.connected || !connectedWallet.account) {
            toast({
                title: "Wallet connection required",
                description: "Vui lòng kết nối ví trước khi tạo token.",
                variant: "destructive",
            });
            return;
        }
        // Validate all required fields
        const requiredFields = [
            'symbol', 'name', 'iconUrl', 'projectUrl', 'decimals', 'totalSupply', 'mintAmount', 'buyFee',
            'assetType', 'backingRatio', 'withdrawalLimit', 'withdrawalCooldown', 'graduationThreshold', 'graduationTarget'
        ];
        for (const field of requiredFields) {
            if (!formData[field as keyof TokenFormData]) {
                toast({
                    title: "Thiếu thông tin",
                    description: "Vui lòng nhập đủ 14 trường bắt buộc.",
                    variant: "destructive",
                });
                return;
            }
        }
        setIsLoading(true);
        try {
            const symbolBytes = Array.from(new TextEncoder().encode(formData.symbol));
            const nameBytes = Array.from(new TextEncoder().encode(formData.name));
            const iconBytes = Array.from(new TextEncoder().encode(formData.iconUrl));
            const projectUrlBytes = Array.from(new TextEncoder().encode(formData.projectUrl));
            const assetTypeBytes = Array.from(new TextEncoder().encode(formData.assetType));
            const args = [
                symbolBytes,
                nameBytes,
                iconBytes,
                projectUrlBytes,
                formData.decimals,
                formData.totalSupply,
                formData.mintAmount,
                formData.buyFee,
                assetTypeBytes,
                formData.backingRatio,
                formData.withdrawalLimit,
                formData.withdrawalCooldown,
                formData.graduationThreshold,
                formData.graduationTarget,
            ];
            const entryFunctionPayload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_token`,
                type_arguments: [],
                arguments: args,
            } as any;
            const response = await safeWallet.safeSignAndSubmitTransaction(entryFunctionPayload);
            if (response?.hash) {
                toast({
                    title: "Tạo token thành công!",
                    description: (
                        <a href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Xem trên Explorer</a>
                    ),
                });
                setFormData({
                    symbol: "",
                    name: "",
                    iconUrl: "",
                    projectUrl: "",
                    decimals: 8,
                    totalSupply: "",
                    mintAmount: "",
                    buyFee: "",
                    assetType: "",
                    backingRatio: "",
                    withdrawalLimit: "",
                    withdrawalCooldown: "",
                    graduationThreshold: "",
                    graduationTarget: "",
                    description: "",
                });
            }
        } catch (error: any) {
            toast({
                title: "Tạo token thất bại",
                description: error.message || "Có lỗi xảy ra khi tạo token.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Tạo Token (Giao diện đơn giản)</h1>
            <form onSubmit={handleCreateToken} className="space-y-4">
                <div>
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input id="symbol" name="symbol" value={formData.symbol} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="iconUrl">Icon URL *</Label>
                    <Input id="iconUrl" name="iconUrl" value={formData.iconUrl} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="projectUrl">Project URL *</Label>
                    <Input id="projectUrl" name="projectUrl" value={formData.projectUrl} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="decimals">Decimals *</Label>
                    <Input id="decimals" name="decimals" type="number" min="0" max="18" value={formData.decimals} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="totalSupply">Total Supply *</Label>
                    <Input id="totalSupply" name="totalSupply" value={formData.totalSupply} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="mintAmount">K (Bonding Curve) *</Label>
                    <Input id="mintAmount" name="mintAmount" value={formData.mintAmount} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="buyFee">Fee Rate *</Label>
                    <Input id="buyFee" name="buyFee" value={formData.buyFee} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Input id="assetType" name="assetType" value={formData.assetType} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="backingRatio">Backing Ratio *</Label>
                    <Input id="backingRatio" name="backingRatio" value={formData.backingRatio} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="withdrawalLimit">Withdrawal Limit *</Label>
                    <Input id="withdrawalLimit" name="withdrawalLimit" value={formData.withdrawalLimit} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="withdrawalCooldown">Withdrawal Cooldown *</Label>
                    <Input id="withdrawalCooldown" name="withdrawalCooldown" value={formData.withdrawalCooldown} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="graduationThreshold">Graduation Threshold *</Label>
                    <Input id="graduationThreshold" name="graduationThreshold" value={formData.graduationThreshold} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="graduationTarget">Graduation Target *</Label>
                    <Input id="graduationTarget" name="graduationTarget" value={formData.graduationTarget} onChange={handleInputChange} required />
                </div>
                <div>
                    <Label htmlFor="description">Description (UI only)</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={2} />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full mt-2">
                    {isLoading ? "Đang tạo..." : "Tạo Token"}
                </Button>
            </form>
        </div>
    );
}
