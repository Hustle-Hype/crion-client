import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface TokenAddressDisplayProps {
    address?: string;
    label?: string;
    showCopy?: boolean;
    truncate?: boolean;
}

export const TokenAddressDisplay: React.FC<TokenAddressDisplayProps> = ({
    address,
    label = "Token Address",
    showCopy = true,
    truncate = true
}) => {
    const [copied, setCopied] = useState(false);

    // Don't render if address is not provided
    if (!address) {
        return (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}:</p>
                    <p className="font-mono text-sm text-muted-foreground">Not available</p>
                </div>
            </div>
        );
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Token address copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: "Copy failed",
                description: "Failed to copy address to clipboard",
                variant: "destructive",
            });
        }
    };

    const displayAddress = truncate && address.length > 16
        ? `${address.slice(0, 8)}...${address.slice(-8)}`
        : address;

    return (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <div className="flex-1">
                <p className="text-xs text-muted-foreground">{label}:</p>
                <p className="font-mono text-sm break-all">{displayAddress}</p>
            </div>
            {showCopy && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 w-8 p-0"
                >
                    {copied ? "✓" : "📋"}
                </Button>
            )}
        </div>
    );
};
