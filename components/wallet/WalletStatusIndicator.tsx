"use client";

import React from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useAuth } from "@/contexts/AuthContext";

interface WalletStatusIndicatorProps {
    showDetails?: boolean;
    className?: string;
}

export function WalletStatusIndicator({
    showDetails = false,
    className = ""
}: WalletStatusIndicatorProps) {
    const aptosWallet = useWallet();
    const connectedWallet = useConnectedWallet();
    const { isAuthenticated, user } = useAuth();

    const getStatus = () => {
        if (!connectedWallet.connected) {
            return {
                status: "disconnected",
                color: "red",
                message: "Not connected",
                icon: "❌"
            };
        }

        if (isAuthenticated && aptosWallet.connected && typeof aptosWallet.signAndSubmitTransaction === 'function') {
            return {
                status: "fully-connected",
                color: "green",
                message: "Fully connected",
                icon: "✅"
            };
        }

        if (isAuthenticated && !aptosWallet.connected) {
            return {
                status: "auth-only",
                color: "yellow",
                message: "Logged in, wallet needed for transactions",
                icon: "⚠️"
            };
        }

        if (aptosWallet.connected && !isAuthenticated) {
            return {
                status: "wallet-only",
                color: "yellow",
                message: "Wallet connected, login needed",
                icon: "⚠️"
            };
        }

        return {
            status: "partial",
            color: "yellow",
            message: "Partial connection",
            icon: "⚠️"
        };
    };

    const status = getStatus();

    if (!showDetails) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <span className="text-sm">{status.icon}</span>
                <span className={`text-sm font-medium ${status.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        status.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                    }`}>
                    {status.message}
                </span>
            </div>
        );
    }

    return (
        <div className={`p-3 rounded-lg border ${className} ${status.color === 'green' ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' :
                status.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
                    'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
            }`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{status.icon}</span>
                <span className={`font-medium ${status.color === 'green' ? 'text-green-800 dark:text-green-200' :
                        status.color === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                            'text-red-800 dark:text-red-200'
                    }`}>
                    {status.message}
                </span>
            </div>

            <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Authentication:</span>
                    <span className={isAuthenticated ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {isAuthenticated ? '✓ Logged in' : '✗ Not logged in'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aptos Wallet:</span>
                    <span className={aptosWallet.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {aptosWallet.connected ? '✓ Connected' : '✗ Not connected'}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Transaction Ready:</span>
                    <span className={typeof aptosWallet.signAndSubmitTransaction === 'function' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {typeof aptosWallet.signAndSubmitTransaction === 'function' ? '✓ Ready' : '✗ Not ready'}
                    </span>
                </div>
                {connectedWallet.account && (
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Address:</span>
                        <span className="text-gray-800 dark:text-gray-200 font-mono">
                            {connectedWallet.account.address.toString().slice(0, 6)}...{connectedWallet.account.address.toString().slice(-4)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
