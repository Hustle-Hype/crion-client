"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/hyper-text";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUnifiedWallet } from "@/hooks/wallet/useUnifiedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Copy, LogOut, User, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function UnifiedWalletSelector() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {
        connect,
        disconnect,
        connected,
        account,
        wallet,
        wallets
    } = useWallet();
    const safeWallet = useSafeWallet();
    const {
        connectUnified,
        disconnectUnified,
        isFullyConnected: unifiedConnected,
        canSignTransactions: canSign,
        status,
        user
    } = useUnifiedWallet();
    const { isAuthenticated } = useAuth();

    // Handle click outside dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const copyAddress = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address.toString());
            toast({
                title: "Address copied",
                description: "Wallet address copied to clipboard",
            });
        }
    };

    const openExplorer = () => {
        if (account?.address) {
            window.open(
                `https://explorer.aptoslabs.com/account/${account.address.toString()}?network=mainnet`,
                "_blank"
            );
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnectUnified();
            setIsDropdownOpen(false);
        } catch (error) {
            console.error("Disconnect error:", error);
        }
    };

    const handleConnectWallet = async (walletName: string) => {
        try {
            setIsDropdownOpen(false);
            await connectUnified(walletName);
        } catch (error) {
            console.error("Connect error:", error);
        }
    };

    const getAvatarUrl = (address: string) => {
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=1e293b&scale=80`;
    };

    // If not connected, show connect button
    if (!connected || !account) {
        return (
            <div className="relative">
                <Button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                    <Wallet className="w-4 h-4 mr-2" />
                    <HyperText>Connect Wallet</HyperText>
                </Button>

                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0B0E14] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden backdrop-blur-sm"
                        style={{
                            background: 'linear-gradient(135deg, rgba(11, 14, 20, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(171, 242, 255, 0.2)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                        }}>
                        <div className="p-4">
                            <h3 className="text-white font-medium mb-3">Connect Wallet</h3>
                            <div className="space-y-2">
                                {wallets.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => handleConnectWallet(wallet.name)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <img
                                            src={wallet.icon}
                                            alt={wallet.name}
                                            className="w-8 h-8 rounded-lg"
                                        />
                                        <div className="text-left">
                                            <div className="text-white font-medium">{wallet.name}</div>
                                            <div className="text-xs text-gray-400">
                                                {wallet.readyState === "Installed" ? "Installed" : "Not Installed"}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // If connected, show user info dropdown
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200 min-w-0"
            >
                <img
                    src={getAvatarUrl(account.address.toString())}
                    alt="Avatar"
                    className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex-shrink-0"
                />
                <div className="min-w-0 hidden sm:flex sm:flex-col">
                    <div className="text-xs lg:text-sm font-medium text-white truncate">
                        {account?.address ? `${account.address.toString().slice(0, 4)}...${account.address.toString().slice(-4)}` : 'No address'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                        {wallet?.name} • {status.aptosConnected && status.authConnected ? "Fully Connected" : status.aptosConnected ? "Wallet Connected" : status.authConnected ? "App Authenticated" : "Disconnected"}
                    </div>
                </div>
                <svg
                    className={`w-3 h-3 lg:w-4 lg:h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0B0E14] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden backdrop-blur-sm"
                    style={{
                        background: 'linear-gradient(135deg, rgba(11, 14, 20, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(171, 242, 255, 0.2)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    }}>

                    {/* User Info Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <img
                                src={getAvatarUrl(account.address.toString())}
                                alt="Avatar"
                                className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-white text-sm">
                                    {user?.name || `User ${account?.address?.toString()?.slice(0, 6) || 'Unknown'}`}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
                                    {account?.address?.toString() || 'No address'}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className={`w-2 h-2 rounded-full ${canSign ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                                    <span className={canSign ? 'text-green-400' : 'text-yellow-400'}>
                                        {canSign ? 'Ready for transactions' : 'Connected via ' + wallet?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Actions */}
                    <div className="p-2">
                        <button
                            onClick={copyAddress}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Address
                        </button>

                        <button
                            onClick={openExplorer}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Explorer
                        </button>

                        {/* Navigation */}
                        <div className="border-t border-white/10 my-2"></div>

                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                window.location.href = '/profile';
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200"
                        >
                            <User className="w-4 h-4" />
                            Profile
                        </button>

                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                window.location.href = '/token/create';
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Token
                        </button>

                        <button
                            onClick={() => {
                                setIsDropdownOpen(false);
                                window.location.href = '/trade';
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Trade Tokens
                        </button>

                        <div className="border-t border-white/10 my-2"></div>

                        <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
