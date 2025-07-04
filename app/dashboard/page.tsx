"use client";

import { useWallet } from "@/hooks/wallet/useWallet";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { account, connected } = useWallet();
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated (has wallet connected and access token)
        const accessToken = localStorage.getItem("accessToken");
        if (!connected || !accessToken) {
            router.push("/auth/login");
        }
    }, [connected, router]);

    if (!connected || !account) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                            Dashboard
                        </h1>

                        {/* Wallet Info */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Wallet Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Address
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-700 p-2 rounded border">
                                        {account.address}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Public Key
                                    </label>
                                    <p className="text-sm text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-700 p-2 rounded border break-all">
                                        {account.publicKey}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Portfolio
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    View your token holdings and NFTs
                                </p>
                                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                    Coming Soon
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Trading
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Swap tokens and manage positions
                                </p>
                                <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                    Coming Soon
                                </button>
                            </div>

                            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Analytics
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Track performance and metrics
                                </p>
                                <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
