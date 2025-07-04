import React from "react";
import { FaUser, FaTrophy, FaWallet } from "react-icons/fa";
import { truncateAddress } from "@/lib/utils";
import toast from "react-hot-toast";

interface PassportOverviewProps {
    userData: {
        name?: string;
        email?: string;
    };
    account: any;
    totalScore: number;
}

export default function PassportOverview({ userData, account, totalScore }: PassportOverviewProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <FaUser className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {userData.name || "Anonymous User"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">
                            {userData.email || "No email provided"}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                        <FaTrophy className="w-6 h-6 text-yellow-500" />
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {totalScore}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Score
                    </p>
                </div>
            </div>

            {/* Wallet Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                    <FaWallet className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Wallet Connection
                    </h3>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            Connected Address
                        </p>
                        <code className="text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border">
                            {account?.address
                                ? truncateAddress(account.address.toString())
                                : "Not connected"}
                        </code>
                    </div>
                    {account?.address && (
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(account.address.toString());
                                toast.success("Address copied to clipboard");
                            }}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Copy
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
