"use client";

import React, { useState, useRef, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
// Setup Aptos SDK for balance fetch
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/hyper-text";
import { useWallet } from "@/hooks/wallet/useWallet";
import { PetraIcon, MartianIcon, PontemIcon } from "@/components/icons/wallet-icons";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface Wallet {
    name: string;
    icon: React.ReactNode;
    installed: boolean;
}

export function WalletSelector() {
    const {
        connect,
        disconnect,
        connected,
        connecting,
        account,
        handleWalletLogin,
        authenticated,
        userData,
        getAvatarUrl,
        logout
    } = useWallet();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [aptBalance, setAptBalance] = useState<string>("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch APT balance when account changes
    useEffect(() => {
        const fetchBalance = async () => {
            if (account?.address) {
                try {
                    const res = await aptos.getAccountAPTAmount({ accountAddress: account.address });
                    // Chia cho 1e8 để chuyển từ octas sang APT
                    const apt = Number(res) / 1e8;
                    setAptBalance(apt.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " APT");
                } catch {
                    setAptBalance("");
                }
            } else {
                setAptBalance("");
            }
        };
        fetchBalance();
    }, [account?.address]);

    // Wallet list with better icons and more options
    const wallets: Wallet[] = [
        {
            name: "Petra",
            icon: <PetraIcon className="w-8 h-8" />,
            installed: typeof window !== "undefined" && !!(window as any).aptos,
        },
        {
            name: "Martian",
            icon: <MartianIcon className="w-8 h-8" />,
            installed: false, // Add when supported
        },
        {
            name: "Pontem",
            icon: <PontemIcon className="w-8 h-8" />,
            installed: false, // Add when supported
        },
    ];

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

    const handleProfileClick = () => {
        setIsDropdownOpen(false);
        router.push('/profile');
    };

    const handleLogout = () => {
        setIsDropdownOpen(false);
        logout();
        toast({
            title: "Logged out",
            description: "You have been successfully logged out.",
        });
    };

    const connectToPetra = async () => {
        await connect();
        setIsModalOpen(false);
    };

    const handleDisconnect = async () => {
        await disconnect();
    };

    // If authenticated, show user dropdown
    if (authenticated && userData && account) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200 min-w-0"
                >
                    <img
                        src={getAvatarUrl(account.address)}
                        alt="Avatar"
                        className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0 hidden sm:flex sm:flex-col">
                        <div className="text-xs lg:text-sm font-medium text-white truncate flex items-center gap-2">
                            {`${account.address.slice(0, 4)}...${account.address.slice(-3)}`}
                            {aptBalance && <span className="text-[#ABF2FF] font-semibold ml-2">{aptBalance}</span>}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                            Score: {userData.score?.totalScore || 0} | Staked: {userData.stakedAmount}
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
                    <div className="absolute right-0 mt-2 w-56 lg:w-64 bg-[#0B0E14] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden backdrop-blur-sm transform origin-top-right"
                        style={{
                            background: 'linear-gradient(135deg, rgba(11, 14, 20, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(171, 242, 255, 0.2)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                            animation: 'fadeInScale 0.2s ease-out'
                        }}>
                        {/* User Info Header */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getAvatarUrl(account.address)}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm">
                                        {userData.username || `User ${account.address.slice(0, 6)}`}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {`${account.address.slice(0, 8)}...${account.address.slice(-6)}`}
                                    </div>
                                    {aptBalance && (
                                        <div className="text-xs text-[#ABF2FF] font-semibold mt-1">{aptBalance}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            <button
                                onClick={handleProfileClick}
                                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200 flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                View Profile
                            </button>

                            <div className="border-t border-white/10 my-1"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // If connected but not authenticated, show connecting status or disconnect option  
    if (connected && account && !authenticated) {
        return (
            <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                </div>
                {connecting ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Signing in...</span>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        onClick={handleDisconnect}
                        className="text-sm"
                    >
                        Disconnect
                    </Button>
                )}
            </div>
        );
    }

    return (
        <>
            <Button
                variant="crion"
                onClick={() => setIsModalOpen(true)}
                disabled={connecting}
                className="relative flex items-center gap-2 text-sm font-medium uppercase overflow-hidden group disabled:opacity-70"
            >
                <div className="relative z-10 flex items-center gap-2">
                    {connecting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Connecting...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <HyperText animateOnHover={false}>Connect Wallet</HyperText>
                        </>
                    )}
                </div>
                {!connecting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ABF2FF]/20 via-transparent to-[#ABF2FF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
            </Button>

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative bg-[#0B0E14] border border-[#1F2937] rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(135deg, rgba(11, 14, 20, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(171, 242, 255, 0.2)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(171, 242, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ABF2FF]/10 to-transparent rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-xl"></div>

                        {/* Header */}
                        <div className="relative flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                                    Connect Wallet
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Choose your preferred wallet to continue
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
                            >
                                <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Wallet Options */}
                        <div className="relative space-y-3">
                            {wallets.map((wallet, index) => (
                                <button
                                    key={wallet.name}
                                    onClick={wallet.name === "Petra" ? connectToPetra : undefined}
                                    disabled={connecting || !wallet.installed}
                                    className={`
                    w-full group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 transform hover:scale-[1.02]
                    ${wallet.installed
                                            ? 'bg-gradient-to-r from-white/5 to-white/10 hover:from-[#ABF2FF]/10 hover:to-[#ABF2FF]/20 border border-white/10 hover:border-[#ABF2FF]/30 hover:shadow-lg hover:shadow-[#ABF2FF]/10'
                                            : 'bg-gray-800/30 border border-gray-700/30 cursor-not-allowed opacity-60'
                                        }
                    ${connecting && wallet.name === "Petra" ? 'animate-pulse' : ''}
                  `}
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        {/* Wallet Icon */}
                                        <div className="relative">
                                            <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300
                        ${wallet.installed
                                                    ? 'bg-gradient-to-br from-[#ABF2FF]/20 to-[#ABF2FF]/10 border-[#ABF2FF]/20 group-hover:border-[#ABF2FF]/40 group-hover:shadow-lg group-hover:shadow-[#ABF2FF]/20'
                                                    : 'bg-gray-700/50 border-gray-600/50'
                                                }
                      `}>
                                                <div className="transition-transform duration-300 group-hover:scale-110">
                                                    {wallet.icon}
                                                </div>
                                            </div>
                                            {wallet.installed && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-green-500 rounded-full border-2 border-[#0B0E14] flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Wallet Info */}
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-white text-lg group-hover:text-[#ABF2FF] transition-colors duration-300">
                                                {wallet.name}
                                            </div>
                                            <div className={`text-sm transition-colors duration-300 ${wallet.installed
                                                ? 'text-gray-400 group-hover:text-gray-300'
                                                : 'text-gray-500'
                                                }`}>
                                                {wallet.installed ? "Ready to connect" : "Not installed"}
                                            </div>
                                        </div>

                                        {/* Status Indicator */}
                                        <div className="flex items-center">
                                            {connecting && wallet.name === "Petra" ? (
                                                <div className="w-6 h-6 border-2 border-[#ABF2FF] border-t-transparent rounded-full animate-spin"></div>
                                            ) : wallet.installed ? (
                                                <svg className="w-5 h-5 text-gray-400 group-hover:text-[#ABF2FF] transition-colors duration-300 transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#ABF2FF]/0 via-[#ABF2FF]/5 to-[#ABF2FF]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                    {/* Ripple effect for installed wallets */}
                                    {wallet.installed && (
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ABF2FF]/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out"></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Warning Message */}
                        {wallets.every(wallet => !wallet.installed) && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl animate-in slide-in-from-bottom duration-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-yellow-300 font-medium text-sm">
                                            No wallets detected
                                        </p>
                                        <p className="text-yellow-400/80 text-xs mt-1">
                                            Please install a supported wallet to continue
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="relative mt-8 pt-6 border-t border-white/10">
                            <p className="text-center text-xs text-gray-500">
                                By connecting, you agree to our{' '}
                                <span className="text-[#ABF2FF] hover:underline cursor-pointer transition-colors">Terms of Service</span>
                                {' '}and{' '}
                                <span className="text-[#ABF2FF] hover:underline cursor-pointer transition-colors">Privacy Policy</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
