"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "@/hooks/use-toast";

interface WalletConnectionNoticeProps {
    title?: string;
    description?: string;
    actionText?: string;
    onConnect?: () => void;
}

export function WalletConnectionNotice({
    title = "Wallet connection needed",
    description = "Please connect your Aptos wallet using the wallet button in the header to create tokens.",
    actionText = "Connect Wallet",
    onConnect
}: WalletConnectionNoticeProps) {
    const aptosWallet = useWallet();

    const handleConnectWallet = async () => {
        if (onConnect) {
            onConnect();
            return;
        }

        try {
            const availableWallets = aptosWallet.wallets || [];
            const petraWallet = availableWallets.find((w: any) =>
                w.name === "Petra" && w.readyState === "Installed"
            );

            if (petraWallet) {
                await aptosWallet.connect(petraWallet.name);
                toast({
                    title: "Wallet connected",
                    description: "Successfully connected to your Aptos wallet!",
                });
            } else {
                toast({
                    title: "Petra wallet not found",
                    description: "Please install Petra wallet extension.",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error("Failed to connect wallet:", error);
            toast({
                title: "Connection failed",
                description: "Failed to connect wallet. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        {title}
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                        {description}
                    </p>
                    <Button
                        onClick={handleConnectWallet}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {actionText}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
