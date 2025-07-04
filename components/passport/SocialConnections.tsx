import React from "react";
import { FaLink } from "react-icons/fa";

interface SocialConnection {
    provider: string;
    socialId: string;
    email?: string;
    username?: string;
    displayName?: string;
    profileUrl?: string;
    verifiedAt: string;
}

interface SocialConnectionsProps {
    socialLinks: SocialConnection[];
    loading: string | null;
    onSocialLink: (provider: "google" | "twitter" | "github") => void;
    getSocialIcon: (provider: string) => React.ReactNode;
    isProviderLinked: (provider: string) => boolean;
    formatDate: (dateString: string) => string;
}

export default function SocialConnections({
    socialLinks,
    loading,
    onSocialLink,
    getSocialIcon,
    isProviderLinked,
    formatDate,
}: SocialConnectionsProps) {
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
                            onClick={() => onSocialLink(provider as any)}
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
