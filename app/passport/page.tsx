"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { FaGithub, FaGoogle, FaTwitter, FaTrophy, FaUser, FaWallet, FaLink, FaCalendar } from "react-icons/fa";
import toast from "react-hot-toast";
import { truncateAddress } from "@/lib/utils";
import axios from "axios";
// Removed PageLayout import since it's already in root layout

interface UserData {
    id: string;
    email?: string;
    name?: string;
    walletAddress?: string;
    linkedAccounts?: {
        google?: boolean;
        twitter?: boolean;
        github?: boolean;
    };
}

interface SocialLink {
    provider: string;
    socialId: string;
    email?: string;
    username?: string;
    displayName?: string;
    profileUrl?: string;
    verifiedAt: string;
}

interface ScoreEntry {
    _id: string;
    issuerId: string;
    scores: {
        key: string;
        raw: number;
        weighted: number;
        note: string;
    }[];
    totalScore: number;
    badge: string;
    recordedAt: string;
    version: number;
    source: string;
}

const API_URL_AUTH = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

// Passport Overview Component
function PassportOverview({ userData, account, totalScore }: {
    userData: UserData;
    account: any;
    totalScore: number;
}) {
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
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
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

// Social Connections Component
function SocialConnections({
    socialLinks,
    loading,
    handleSocialLink
}: {
    socialLinks: SocialLink[];
    loading: string | null;
    handleSocialLink: (provider: "google" | "twitter" | "github") => void;
}) {
    const getSocialIcon = (provider: string) => {
        switch (provider) {
            case "google":
                return <FaGoogle className="w-5 h-5 text-red-500" />;
            case "twitter":
                return <FaTwitter className="w-5 h-5 text-blue-400" />;
            case "github":
                return <FaGithub className="w-5 h-5 text-gray-900 dark:text-white" />;
            default:
                return <FaLink className="w-5 h-5 text-gray-500" />;
        }
    };

    const isProviderLinked = (provider: string) => {
        return socialLinks.some(link => link.provider === provider);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FaLink className="w-5 h-5 mr-3 text-blue-600" />
                Social Connections
            </h3>

            {/* Connected Accounts */}
            {socialLinks.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                        Connected Accounts
                    </h4>
                    <div className="space-y-3">
                        {socialLinks.map((link, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700"
                            >
                                <div className="flex items-center space-x-3">
                                    {getSocialIcon(link.provider)}
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                                            {link.provider}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {link.displayName || link.email || link.username}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                        ✓ Verified
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(link.verifiedAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Connections */}
            <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Available Connections
                </h4>
                <div className="space-y-3">
                    {["google", "twitter", "github"].map((provider) => (
                        <button
                            key={provider}
                            onClick={() => handleSocialLink(provider as any)}
                            disabled={loading !== null || isProviderLinked(provider)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${isProviderLinked(provider)
                                ? "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50 cursor-not-allowed"
                                : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                {getSocialIcon(provider)}
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                    {isProviderLinked(provider) ? `${provider} Connected` : `Connect ${provider}`}
                                </span>
                            </div>
                            {loading === provider && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Achievement History Component
function AchievementHistory({ scoreHistory }: { scoreHistory: ScoreEntry[] }) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FaTrophy className="w-5 h-5 mr-3 text-yellow-500" />
                Achievement History
            </h3>

            {scoreHistory.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {scoreHistory.map((entry) => (
                        <div
                            key={entry._id}
                            className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                                        {entry.badge.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        +{entry.totalScore}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <FaCalendar className="w-3 h-3 mr-1" />
                                    {formatDate(entry.recordedAt)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {entry.scores.map((score, scoreIndex) => (
                                    <div key={scoreIndex} className="text-sm">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {score.note}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{score.key}</span>
                                            <span>•</span>
                                            <span>Raw: {score.raw}</span>
                                            <span>•</span>
                                            <span>Weighted: {score.weighted}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <FaTrophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No achievements yet. Start by connecting your social accounts!
                    </p>
                </div>
            )}
        </div>
    );
}

export default function PassportPage() {
    const { account, connected } = useWallet();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        const userDataStr = localStorage.getItem("userData");

        console.log("Passport - Debug:", { accessToken: !!accessToken, connected, userDataStr: !!userDataStr });

        if (!accessToken) {
            console.log("Passport - No access token, redirecting to home");
            router.push("/");
            return;
        }

        if (userDataStr) {
            setUserData(JSON.parse(userDataStr));
        }

        fetchPassportData();
    }, [router]);

    const fetchPassportData = async () => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) return;

            setDataLoading(true);

            // Fetch social links
            const socialResponse = await axios.get(
                `${API_URL_AUTH}/issuer/me/social-links`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (socialResponse.data.status === 200) {
                setSocialLinks(socialResponse.data.data);
            }

            // Fetch score history
            const scoreResponse = await axios.get(
                `${API_URL_AUTH}/issuer/me/score-history`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (scoreResponse.data.status === 200) {
                setScoreHistory(scoreResponse.data.data);
            }
        } catch (error) {
            console.error("Error fetching passport data:", error);
            toast.error("Failed to load passport data");
        } finally {
            setDataLoading(false);
        }
    };

    const handleSocialLink = async (provider: "google" | "twitter" | "github") => {
        setLoading(provider);
        let popupWindow: Window | null = null;
        let checkPopupInterval: NodeJS.Timeout | null = null;

        const cleanup = () => {
            if (checkPopupInterval) {
                clearInterval(checkPopupInterval);
            }
            window.removeEventListener("message", handleMessage);
            setLoading(null);
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.data.source === "react-devtools-bridge") {
                return;
            }

            const allowedOrigins = [
                process.env.NEXT_PUBLIC_API_URL,
                "http://localhost:3000",
                "http://localhost:8080",
                "https://basic-login-rose.vercel.app",
            ];

            const isAllowedOrigin =
                process.env.NODE_ENV === "development"
                    ? true
                    : allowedOrigins.includes(event.origin);

            if (isAllowedOrigin && event.data) {
                if (typeof event.data === "object" && "success" in event.data) {
                    if (event.data.success) {
                        toast.success(
                            `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`
                        );
                        fetchPassportData();
                    } else {
                        const errorMessage = event.data.error || `Failed to link ${provider} account`;
                        toast.error(errorMessage);
                    }

                    cleanup();
                    if (popupWindow && !popupWindow.closed) {
                        popupWindow.close();
                    }
                }
            }
        };

        try {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                throw new Error("No access token found");
            }

            const width = 500;
            const height = 600;
            const left = (window.innerWidth - width) / 2 + window.screenX;
            const top = (window.innerHeight - height) / 2 + window.screenY;
            const features = [
                `width=${width}`,
                `height=${height}`,
                `left=${left}`,
                `top=${top}`,
                "resizable=yes",
                "scrollbars=yes",
                "status=yes",
                "toolbar=no",
                "menubar=no",
                "location=yes",
            ].join(",");

            window.addEventListener("message", handleMessage);

            const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "");
            const authUrl = `${baseUrl}/api/v1/issuer/me/link/${provider}`;
            const urlWithToken = `${authUrl}?accessToken=${encodeURIComponent(accessToken)}`;

            popupWindow = window.open(urlWithToken, "_blank", features);

            if (!popupWindow) {
                throw new Error("Popup was blocked. Please allow popups for this site.");
            }

            checkPopupInterval = setInterval(() => {
                if (popupWindow?.closed) {
                    cleanup();
                    if (loading === provider) {
                        toast.error(`${provider} linking was cancelled`);
                    }
                }
            }, 1000);
        } catch (error) {
            console.error(`${provider} linking error:`, error);
            toast.error(
                error instanceof Error ? error.message : `Failed to link ${provider} account`
            );
            cleanup();
        }
    };

    const getTotalScore = () => {
        return scoreHistory.reduce((total, entry) => total + entry.totalScore, 0);
    };

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Passport Overview */}
                    <PassportOverview
                        userData={userData}
                        account={account}
                        totalScore={getTotalScore()}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Social Connections */}
                        <SocialConnections
                            socialLinks={socialLinks}
                            loading={loading}
                            handleSocialLink={handleSocialLink}
                        />

                        {/* Achievement History */}
                        <AchievementHistory scoreHistory={scoreHistory} />
                    </div>
                </div>
            )}
        </div>
    );
}
