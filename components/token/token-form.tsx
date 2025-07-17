import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface TokenFormData {
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
    email?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
}

export interface TokenFormProps {
    formData: TokenFormData;
    onChange: (e: React.ChangeEvent<any>) => void;
    onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

const TokenForm: React.FC<TokenFormProps> = ({ formData, onChange, onImageUpload, disabled }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Token Name</Label>
                <Input name="name" value={formData.name} onChange={onChange} maxLength={50} placeholder="e.g. Real Estate Token" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Ticker</Label>
                <Input name="symbol" value={formData.symbol} onChange={onChange} maxLength={50} placeholder="e.g. RETK" disabled={disabled} />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Token Icon</Label>
                <div className="flex flex-col gap-2">
                    <Input name="iconUrl" value={formData.iconUrl} onChange={onChange} placeholder="e.g. https://domain.com/token.png" disabled={disabled} />
                    <label className="block">
                        <span className="sr-only">Choose file</span>
                        <input type="file" accept="image/*" onChange={onImageUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#23272b] file:text-white hover:file:bg-[#18191a] file:transition-colors file:duration-150" aria-label="No file chosen" disabled={disabled} />
                    </label>
                    {formData.iconUrl && (
                        <img src={formData.iconUrl} alt="Token Icon Preview" className="w-20 h-20 object-cover rounded mt-2 border border-white/10" />
                    )}
                </div>
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Project URL</Label>
                <Input name="projectUrl" value={formData.projectUrl} onChange={onChange} placeholder="e.g. https://domain.com" disabled={disabled} />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Description</Label>
                <Textarea name="description" value={formData.description} onChange={onChange} rows={3} placeholder="Describe your asset in detail..." disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Decimals</Label>
                <Input name="decimals" value={formData.decimals} onChange={onChange} type="number" min={0} max={18} placeholder="e.g. 8" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Total Supply</Label>
                <Input name="totalSupply" value={formData.totalSupply} onChange={onChange} type="number" placeholder="e.g. 1000000000000000" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Mint Amount (K)</Label>
                <Input name="mintAmount" value={formData.mintAmount} onChange={onChange} type="number" placeholder="e.g. 100" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Buy Fee</Label>
                <Input name="buyFee" value={formData.buyFee} onChange={onChange} type="number" placeholder="e.g. 300" disabled={disabled} />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Asset Type</Label>
                <select name="assetType" value={formData.assetType} onChange={onChange} className="flex h-14 w-full items-center justify-between px-6 py-4 text-base text-white focus:outline-none border border-white/10 bg-[#18191a] appearance-none transition-all duration-150 shadow-sm" style={{ backgroundColor: "#18191a", color: "#fff", fontSize: "1.125rem", borderRadius: "1.5rem", fontWeight: 500, boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)" }} disabled={disabled}>
                    <option value="" disabled hidden>Select the asset type</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                    <option value="EQUITY_STARTUP">Equity / Startup</option>
                    <option value="COMMODITIES">Commodities</option>
                    <option value="IP_RIGHTS">IP Rights</option>
                    <option value="HIGH_VALUE_ART">High Value Art</option>
                    <option value="COLLECTIBLES">Collectibles</option>
                    <option value="SPORTS_MEMORABILIA">Sports Memorabilia</option>
                    <option value="DIGITAL_COLLECTIBLES">Digital Collectibles</option>
                    <option value="EVENT_TICKETS">Event Tickets</option>
                    <option value="LUXURY_GOODS">Luxury Goods</option>
                    <option value="ANTIQUES">Antiques</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Backing Ratio</Label>
                <Input name="backingRatio" value={formData.backingRatio} onChange={onChange} type="number" placeholder="e.g. 5000" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Withdrawal Limit</Label>
                <Input name="withdrawalLimit" value={formData.withdrawalLimit} onChange={onChange} type="number" placeholder="e.g. 1000" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Withdrawal Cooldown</Label>
                <Input name="withdrawalCooldown" value={formData.withdrawalCooldown} onChange={onChange} type="number" placeholder="e.g. 86400 (seconds)" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Graduation Threshold</Label>
                <Input name="graduationThreshold" value={formData.graduationThreshold} onChange={onChange} type="number" placeholder="e.g. 100000000" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2 text-white font-normal mb-2">Graduation Target</Label>
                <Input name="graduationTarget" value={formData.graduationTarget} onChange={onChange} type="number" placeholder="e.g. 1000000000" disabled={disabled} />
            </div>
            {/* Social Links */}
            <div className="space-y-2">
                <Label className="mb-2 text-white text-sm font-normal">Email (Optional)</Label>
                <Input name="email" value={formData.email || ""} onChange={onChange} placeholder="e.g. user@example.com" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="mb-2 text-white text-sm font-normal">Website (Optional)</Label>
                <Input name="website" value={formData.website || ""} onChange={onChange} placeholder="e.g. https://abc.org" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="mb-2 text-white text-sm font-normal">X (Optional)</Label>
                <Input name="twitter" value={formData.twitter || ""} onChange={onChange} placeholder="e.g. x.com/yourname" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="mb-2 text-white text-sm font-normal">Telegram (Optional)</Label>
                <Input name="telegram" value={formData.telegram || ""} onChange={onChange} placeholder="e.g. t.me/yourgroup" disabled={disabled} />
            </div>
            <div className="space-y-2">
                <Label className="mb-2 text-white text-sm font-normal">Discord (Optional)</Label>
                <Input name="discord" value={formData.discord || ""} onChange={onChange} placeholder="e.g. discord.gg/yourserver" disabled={disabled} />
            </div>
        </div>
    );
};

export default TokenForm;
