
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { toast } from "@/hooks/use-toast";


const CONTRACT_ADDRESS = "0x789aebdecec5bc128a2146e2b5b4b9c4111ad0b48c065ab1cd96871e20ac3e97";
const MODULE_NAME = "fa_factory";

// Helper to show real-world value (divide by 10^decimals)
const getRealValue = (value: string | number, decimals: number, isTime?: boolean): string => {
    if (!value || isNaN(Number(value))) return '';
    if (isTime) {
        // For seconds, show in hours/days if large
        const sec = Number(value);
        if (sec < 60) return `${sec} seconds`;
        if (sec < 3600) return `${(sec / 60).toFixed(2)} minutes`;
        if (sec < 86400) return `${(sec / 3600).toFixed(2)} hours`;
        return `${(sec / 86400).toFixed(2)} days`;
    }
    const num = Number(value) / Math.pow(10, Number(decimals));
    if (isNaN(num)) return '';
    return num.toLocaleString(undefined, { maximumFractionDigits: Number(decimals) });
};

interface TokenFormData {
    symbol: string;
    name: string;
    iconUrl: string;
    projectUrl: string;
    description: string;
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
    // Social links (phase 2, not used in payload)
    email?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
}



export default function SimpleCreateTokenPage() {
    // Upload image handler
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch("https://crion.onrender.com/api/v1/issuer/upload/image", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.status === 200 && data.data?.url) {
                setFormData(prev => ({ ...prev, iconUrl: data.data.url }));
                toast({ title: "Upload thành công", description: "Ảnh đã được tải lên!", variant: "default" });
            } else {
                toast({ title: "Upload thất bại", description: data.message || "Không thể upload ảnh", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Lỗi upload", description: "Không thể upload ảnh", variant: "destructive" });
        }
    };
    const connectedWallet = useConnectedWallet();
    const safeWallet = useSafeWallet();
    const [step, setStep] = useState(0); // 0: Asset Info, 1: Social Links, 2: Review
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TokenFormData>({
        symbol: "",
        name: "",
        iconUrl: "",
        projectUrl: "",
        description: "",
        decimals: 8,
        totalSupply: "",
        mintAmount: "",
        buyFee: "",
        assetType: "REAL_ESTATE",
        backingRatio: "",
        withdrawalLimit: "",
        withdrawalCooldown: "",
        graduationThreshold: "",
        graduationTarget: "",
        email: "",
        website: "",
        twitter: "",
        telegram: "",
        discord: "",
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (step === 0) {
            // Validate only Move args fields for step 0
            const requiredFields = [
                "symbol",
                "name",
                "iconUrl",
                "projectUrl",
                "description",
                "decimals",
                "totalSupply",
                "mintAmount",
                "buyFee",
                "assetType",
                "backingRatio",
                "withdrawalLimit",
                "withdrawalCooldown",
                "graduationThreshold",
                "graduationTarget",
            ];
            for (const field of requiredFields) {
                if (!formData[field as keyof TokenFormData]) {
                    toast({
                        title: "Missing information",
                        description: "Please fill in all required asset information.",
                        variant: "destructive",
                    });
                    return;
                }
            }
        }
        setStep((prev) => prev + 1);
    };
    const handleBack = () => setStep((prev) => prev - 1);

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connectedWallet.connected || !connectedWallet.account) {
            toast({
                title: "Wallet connection required",
                description: "Please connect your wallet before creating a token.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        try {
            // Only use Move args fields for payload
            const symbolBytes = Array.from(new TextEncoder().encode(formData.symbol));
            const nameBytes = Array.from(new TextEncoder().encode(formData.name));
            const iconBytes = Array.from(new TextEncoder().encode(formData.iconUrl));
            const projectUrlBytes = Array.from(new TextEncoder().encode(formData.projectUrl));
            const descriptionBytes = Array.from(new TextEncoder().encode(formData.description));
            const assetTypeBytes = Array.from(new TextEncoder().encode(formData.assetType));
            const args = [
                symbolBytes,
                nameBytes,
                iconBytes,
                projectUrlBytes,
                descriptionBytes,
                Number(formData.decimals),
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
                    title: "Token created successfully!",
                    description: (
                        <a href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View on Explorer</a>
                    ),
                });
                setFormData({
                    symbol: "",
                    name: "",
                    iconUrl: "",
                    projectUrl: "",
                    description: "",
                    decimals: 8,
                    totalSupply: "",
                    mintAmount: "",
                    buyFee: "",
                    assetType: "REAL_ESTATE",
                    backingRatio: "",
                    withdrawalLimit: "",
                    withdrawalCooldown: "",
                    graduationThreshold: "",
                    graduationTarget: "",
                    email: "",
                    website: "",
                    twitter: "",
                    telegram: "",
                    discord: "",
                });
                setStep(0);
            }
        } catch (error: any) {
            let desc = "An error occurred while creating the token.";
            if (error?.message) {
                desc = typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
            }
            toast({
                title: "Token creation failed",
                description: desc,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Stepper data
    const steps = [
        { label: "Asset Information" },
        { label: "Social Links" },
        { label: "Review & Deploy" },
    ];

    return (
        <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-[100px] pt-10 pb-10 lg:pb-10 min-h-[calc(100vh-200px)]">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Stepper */}
                <div className="w-full lg:w-[500px] flex justify-center lg:justify-start">
                    <div className="flex flex-col w-full">
                        <h1 className="text-white text-2xl sm:text-[28px] lg:text-[32px] font-bold mb-4 lg:mb-6 text-center lg:text-left">
                            Tokenize Your Asset
                        </h1>
                        {/* Mobile stepper */}
                        <div className="flex lg:hidden overflow-x-auto pb-4 scrollbar-hide">
                            <div className="flex space-x-4 min-w-max">
                                {steps.map((s, i) => (
                                    <div className="flex flex-col items-center" key={i} data-step={i}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className={`flex cursor-pointer items-center justify-center w-8 h-8 rounded-lg relative ${step === i ? "text-white" : "text-white/[0.4]"}`}
                                                onClick={() => setStep(i)}
                                            >
                                                <span className="absolute inset-0 rounded-lg overflow-hidden">
                                                    <span className={step === i ? "absolute inset-0 rounded-lg bg-gradient-to-r from-[#2563eb] to-[#38bdf8]" : "absolute inset-0 rounded-lg bg-[#212121]"}></span>
                                                </span>
                                                <span className={step === i ? "absolute inset-0 rounded-lg border border-white/80" : "absolute inset-0 rounded-lg border border-gradient-to-b from-white/30 to-[#181818]/40"}></span>
                                                <span className={step === i ? "absolute inset-0 rounded-lg shadow-[0px_3px_0px_0px_rgba(37,99,235,0.44)]" : "absolute inset-0 rounded-lg shadow-[0px_3px_0px_0px_rgba(255,255,255,0.05)]"}></span>
                                                <span className="relative z-10 font-medium"><span>{i + 1}</span></span>
                                            </div>
                                            <span className={`font-medium text-sm ${step === i ? "text-white" : "text-white/[0.64]"}`}>{s.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Desktop stepper */}
                        <div className="hidden lg:flex lg:flex-col">
                            {steps.map((s, i) => (
                                <div className="flex flex-col" key={i}>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div
                                            className={`flex cursor-pointer items-center justify-center w-8 h-8 rounded-lg relative ${step === i ? "text-white" : "text-white/[0.4]"}`}
                                            onClick={() => setStep(i)}
                                        >
                                            <span className="absolute inset-0 rounded-lg overflow-hidden">
                                                <span className={step === i ? "absolute inset-0 rounded-lg bg-gradient-to-r from-[#2563eb] to-[#38bdf8]" : "absolute inset-0 rounded-lg bg-[#212121]"}></span>
                                            </span>
                                            <span className={step === i ? "absolute inset-0 rounded-lg border border-white/80" : "absolute inset-0 rounded-lg border border-gradient-to-b from-white/30 to-[#181818]/40"}></span>
                                            <span className={step === i ? "absolute inset-0 rounded-lg shadow-[0px_3px_0px_0px_rgba(37,99,235,0.44)]" : "absolute inset-0 rounded-lg shadow-[0px_3px_0px_0px_rgba(255,255,255,0.05)]"}></span>
                                            <span className="relative z-10 font-medium"><span>{i + 1}</span></span>
                                        </div>
                                        <span className={`font-medium text-base ${step === i ? "text-white" : "text-white/[0.64]"}`}>{s.label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`h-4 flex mb-3`}>
                                            <div className={`w-px h-full ${step > i ? "bg-[#2563eb]" : "bg-white/20"} ml-3.5`}></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Main content */}
                <div className="w-full lg:w-3/4 p-4 sm:p-6 lg:p-8 rounded-xl bg-card relative">
                    {step === 0 && (
                        <form className="space-y-6 sm:space-y-8" onSubmit={e => { e.preventDefault(); handleNext(); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Token Name</label>
                                    <Input name="name" value={formData.name} onChange={handleInputChange} maxLength={50} placeholder="e.g. Real Estate Token" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Ticker</label>
                                    <Input name="symbol" value={formData.symbol} onChange={handleInputChange} maxLength={50} placeholder="e.g. RETK" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Token Icon</label>
                                    <div className="flex flex-col gap-2">
                                        <Input name="iconUrl" value={formData.iconUrl} onChange={handleInputChange} placeholder="e.g. https://domain.com/token.png" />
                                        <label className="block">
                                            <span className="sr-only">Choose file</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#23272b] file:text-white hover:file:bg-[#18191a] file:transition-colors file:duration-150"
                                                aria-label="No file chosen"
                                            />
                                        </label>
                                        {formData.iconUrl && (
                                            <img src={formData.iconUrl} alt="Token Icon Preview" className="w-20 h-20 object-cover rounded mt-2 border border-white/10" />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Project URL</label>
                                    <Input name="projectUrl" value={formData.projectUrl} onChange={handleInputChange} placeholder="e.g. https://domain.com" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Description</label>
                                    <Textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Describe your asset in detail..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Decimals</label>
                                    <Input name="decimals" value={formData.decimals} onChange={handleInputChange} type="number" min={0} max={18} placeholder="e.g. 8" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Total Supply
                                        {formData.totalSupply && formData.decimals !== undefined && !isNaN(Number(formData.totalSupply)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.totalSupply, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="totalSupply" value={formData.totalSupply} onChange={handleInputChange} type="number" placeholder="e.g. 1000000000000000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Mint Amount (K)
                                        {formData.mintAmount && formData.decimals !== undefined && !isNaN(Number(formData.mintAmount)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.mintAmount, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="mintAmount" value={formData.mintAmount} onChange={handleInputChange} type="number" placeholder="e.g. 100" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Buy Fee
                                        {formData.buyFee && formData.decimals !== undefined && !isNaN(Number(formData.buyFee)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.buyFee, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="buyFee" value={formData.buyFee} onChange={handleInputChange} type="number" placeholder="e.g. 300" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Asset Type</label>
                                    <select
                                        name="assetType"
                                        value={formData.assetType}
                                        onChange={handleInputChange}
                                        className="flex h-14 w-full items-center justify-between px-6 py-4 text-base text-white focus:outline-none border border-white/10 bg-[#18191a] appearance-none transition-all duration-150 shadow-sm"
                                        style={{
                                            backgroundColor: '#18191a',
                                            color: '#fff',
                                            fontSize: '1.125rem',
                                            borderRadius: '1.5rem',
                                            fontWeight: 500,
                                            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                                        }}
                                    >
                                        <option value="" disabled hidden style={{ borderRadius: '1.5rem' }}>Select the asset type</option>
                                        <option value="REAL_ESTATE" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Real Estate</option>
                                        <option value="EQUITY_STARTUP" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Equity / Startup</option>
                                        <option value="COMMODITIES" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Commodities</option>
                                        <option value="IP_RIGHTS" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>IP Rights</option>
                                        <option value="HIGH_VALUE_ART" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>High Value Art</option>
                                        <option value="COLLECTIBLES" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Collectibles</option>
                                        <option value="SPORTS_MEMORABILIA" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Sports Memorabilia</option>
                                        <option value="DIGITAL_COLLECTIBLES" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Digital Collectibles</option>
                                        <option value="EVENT_TICKETS" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Event Tickets</option>
                                        <option value="LUXURY_GOODS" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Luxury Goods</option>
                                        <option value="ANTIQUES" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Antiques</option>
                                        <option value="OTHER" style={{ borderRadius: '1.5rem', padding: '14px 24px' }}>Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Backing Ratio
                                        {formData.backingRatio && formData.decimals !== undefined && !isNaN(Number(formData.backingRatio)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.backingRatio, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="backingRatio" value={formData.backingRatio} onChange={handleInputChange} type="number" placeholder="e.g. 5000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Withdrawal Limit
                                        {formData.withdrawalLimit && formData.decimals !== undefined && !isNaN(Number(formData.withdrawalLimit)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.withdrawalLimit, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="withdrawalLimit" value={formData.withdrawalLimit} onChange={handleInputChange} type="number" placeholder="e.g. 1000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Withdrawal Cooldown
                                        {formData.withdrawalCooldown && !isNaN(Number(formData.withdrawalCooldown)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.withdrawalCooldown, formData.decimals, true)})</span>
                                        }
                                    </label>
                                    <Input name="withdrawalCooldown" value={formData.withdrawalCooldown} onChange={handleInputChange} type="number" placeholder="e.g. 86400 (seconds)" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Graduation Threshold
                                        {formData.graduationThreshold && formData.decimals !== undefined && !isNaN(Number(formData.graduationThreshold)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.graduationThreshold, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="graduationThreshold" value={formData.graduationThreshold} onChange={handleInputChange} type="number" placeholder="e.g. 100000000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs flex items-center gap-2 text-white font-normal mb-2">
                                        Graduation Target
                                        {formData.graduationTarget && formData.decimals !== undefined && !isNaN(Number(formData.graduationTarget)) &&
                                            <span className="ml-2 text-white/50">(Example: {getRealValue(formData.graduationTarget, formData.decimals)} {formData.symbol || ''})</span>
                                        }
                                    </label>
                                    <Input name="graduationTarget" value={formData.graduationTarget} onChange={handleInputChange} type="number" placeholder="e.g. 1000000000" />
                                </div>
                            </div>
                            <div className="flex justify-center sm:justify-end mt-6 sm:mt-8">
                                <Button type="submit" className="w-full sm:w-[160px]" disabled={isLoading}>
                                    Next
                                </Button>
                            </div>
                        </form>
                    )}
                    {step === 1 && (
                        <form className="space-y-8" onSubmit={e => { e.preventDefault(); handleNext(); }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="mb-2 text-white text-sm font-normal">Email (Optional)</label>
                                    <Input name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g. user@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="mb-2 text-white text-sm font-normal">Website (Optional)</label>
                                    <Input name="website" value={formData.website} onChange={handleInputChange} placeholder="e.g. https://abc.org" />
                                </div>
                                <div className="space-y-2">
                                    <label className="mb-2 text-white text-sm font-normal">X (Optional)</label>
                                    <Input name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="e.g. x.com/yourname" />
                                </div>
                                <div className="space-y-2">
                                    <label className="mb-2 text-white text-sm font-normal">Telegram (Optional)</label>
                                    <Input name="telegram" value={formData.telegram} onChange={handleInputChange} placeholder="e.g. t.me/yourgroup" />
                                </div>
                                <div className="space-y-2">
                                    <label className="mb-2 text-white text-sm font-normal">Discord (Optional)</label>
                                    <Input name="discord" value={formData.discord} onChange={handleInputChange} placeholder="e.g. discord.gg/yourserver" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6">
                                <Button type="button" variant="outline" className="w-[160px] bg-[#212121] text-white border border-white/20 shadow-md" onClick={handleBack}>
                                    Back
                                </Button>
                                <Button type="submit" className="w-[160px]">
                                    Next
                                </Button>
                            </div>
                        </form>
                    )}
                    {step === 2 && (
                        <form className="space-y-6 sm:space-y-8 w-full" onSubmit={handleCreateToken}>
                            <div className="space-y-1 sm:space-y-2">
                                <h2 className="text-xl sm:text-2xl font-medium text-white">Final Review Before Deployment</h2>
                                <p className="text-white/[0.4] text-sm sm:text-base">Verify the details below. You can go back to edit any section before proceeding</p>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <h3 className="text-base sm:text-lg font-normal text-[#A7A7A7]">Asset Information</h3>
                                    </div>
                                </div>
                                <div className="px-4 sm:px-10 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:gap-8 space-y-6 sm:space-y-0">
                                        <div className="flex flex-col items-start">
                                            <div className="text-white/[0.4] text-sm sm:text-base mb-2 flex items-center gap-2"><span>Token Image</span></div>
                                            <div className="h-[180px] w-[180px] sm:h-[216px] sm:w-[216px] rounded-2xl border border-white/10 bg-white/5 p-2 overflow-hidden">
                                                {formData.iconUrl ? <img alt="Token logo" className="w-full h-full object-cover rounded-xl" src={formData.iconUrl} /> : <div className="w-full h-full flex items-center justify-center text-white/30">No Image</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Asset Type</span><span className="text-white/[0.64] text-base font-medium">{formData.assetType}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Asset Description</span><span className="text-white/[0.64] text-base font-medium">{formData.description}</span></div>
                                </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <h3 className="text-base sm:text-lg font-normal text-[#A7A7A7]">Token Configuration</h3>
                                    </div>
                                </div>
                                <div className="px-4 sm:px-10 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Token Name</span><span className="text-white/[0.64] text-base font-medium">{formData.name}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Ticker</span><span className="text-white/[0.64] text-base font-medium">{formData.symbol}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Decimals</span><span className="text-white/[0.64] text-base font-medium">{formData.decimals}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Network</span><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></div><span className="text-white/[0.64] text-base font-medium">Base Aptos</span></div></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Smart Contract Standard</span><span className="text-white/[0.64] text-base font-medium">BEP-20</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Owner Wallet Address</span><span className="text-white/[0.64] text-base font-medium break-all sm:truncate sm:max-w-md">{
                                        (() => {
                                            if (!connectedWallet.account) return "-";
                                            if (typeof connectedWallet.account === 'string') return connectedWallet.account;
                                            if (typeof connectedWallet.account === 'object') {
                                                // Try .address as string, or .address.toString()
                                                // AccountInfo or { address: string }
                                                const addr = (connectedWallet.account as any).address;
                                                if (!addr) return "-";
                                                return typeof addr === 'string' ? addr : (addr.toString ? addr.toString() : JSON.stringify(addr));
                                            }
                                            return "-";
                                        })()
                                    }</span></div>
                                </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <h3 className="text-base sm:text-lg font-normal text-[#A7A7A7]">Bonding Curve</h3>
                                    </div>
                                </div>
                                <div className="px-4 sm:px-10 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Initial Price</span><span className="text-white/[0.64] text-base font-medium"><div className="flex"><span>{formData.mintAmount}</span><span className="pl-1">RWA</span></div></span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Total Supply</span><span className="text-white/[0.64] text-base font-medium"><div className="flex"><span>{formData.totalSupply}</span><span className="pl-1">RWA</span></div></span></div>
                                </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <h3 className="text-base sm:text-lg font-normal text-[#A7A7A7]">Social Links</h3>
                                    </div>
                                </div>
                                <div className="px-4 sm:px-10 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Email</span><span className="text-white/[0.64] text-base font-medium break-all sm:break-normal">{formData.email || '-'}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Website</span><span className="text-white/[0.64] text-base font-medium break-all sm:break-normal">{formData.website || '-'}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">X</span><span className="text-white/[0.64] text-base font-medium break-all sm:break-normal">{formData.twitter || '-'}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Telegram</span><span className="text-white/[0.64] text-base font-medium break-all sm:break-normal">{formData.telegram || '-'}</span></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"><span className="text-white/[0.4] text-sm sm:text-base sm:w-[240px] sm:flex-shrink-0">Discord</span><span className="text-white/[0.64] text-base font-medium break-all sm:break-normal">{formData.discord || '-'}</span></div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
                                <Button type="button" variant="outline" className="w-full sm:w-[160px] bg-[#212121] text-white border border-white/20 shadow-md" onClick={handleBack}>
                                    Back
                                </Button>
                                <Button type="submit" className="w-full sm:w-[160px]" disabled={isLoading}>
                                    {isLoading ? "Đang tạo..." : "Submit"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
