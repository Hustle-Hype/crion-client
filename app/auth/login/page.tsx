"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { WalletSelector } from "@/components/wallet-selector";

export default function LoginPage() {
    const { account, connected, handleWalletLogin, connecting } = useWallet();
    const router = useRouter();

    const onWalletLogin = async () => {
        await handleWalletLogin();
        // If login successful, redirect to dashboard
        setTimeout(() => {
            router.push("/dashboard");
        }, 2000); // Tăng thời gian để user thấy được auto-connect
    };

    return (
        <div className="flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8">
                {/* Logo and Header */}
                <div className="text-center">
                    <div className="mx-auto w-20 h-20 relative mb-4">
                        <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            C
                        </div>
                    </div>
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">
                        Welcome Back
                    </h2>
                    <p className="mt-3 text-gray-600 dark:text-gray-400">
                        Sign in to continue to your account
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl px-8 py-10 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-6">
                        {/* Wallet Connect */}
                        <div className="space-y-4">
                            <WalletSelector />
                            {connected && account && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <p className="text-sm text-green-800 dark:text-green-200">
                                            Wallet Connected: {`${account.address.slice(0, 8)}...${account.address.slice(-6)}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onWalletLogin}
                                        disabled={connecting}
                                        className="w-full flex justify-center items-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        {connecting ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Logging in...
                                            </div>
                                        ) : (
                                            "Login with Wallet"
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            By signing in, you agree to our{" "}
                            <Link
                                href="/terms-of-service"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy-policy"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
