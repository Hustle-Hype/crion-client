// Returns points for each provider

"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaGithub,
  FaGoogle,
  FaTwitter,
  FaTrophy,
  FaUser,
  FaWallet,
  FaLink,
  FaCalendar,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import { truncateAddress } from "@/lib/utils";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { useWallet } from "@/hooks/wallet/useWallet";
// Removed PageLayout import since it's already in root layout

interface UserData {
  _id: string;
  primaryWallet: string;
  name: string;
  bio: string;
  avatar: string | null;
  stakedAmount: number;
  socialLinks: Array<{
    provider: string;
    socialId: string;
    email?: string;
    username?: string;
    displayName?: string;
    profileUrl?: string;
    verifiedAt: string;
  }>;
  walletLinks: Array<{
    network: string;
    address: string;
    verifiedAt: string;
    isPrimary: boolean;
  }>;
  kycStatus: {
    status: string;
  };
  score: {
    _id: string;
    issuerId: string;
    scores: {
      staking: number;
      walletBehavior: number;
      launchHistory: number;
      social: number;
      kyc: number;
    };
    totalScore: number;
    tier: string;
    createdAt: string;
    updatedAt: string;
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

interface WalletLink {
  network: string;
  address: string;
  verifiedAt: string;
  isPrimary: boolean;
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

// Wallet Connect Prompt Component
function WalletConnectPrompt() {
  const { connect, connecting } = useWallet();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#0B0E14] rounded-3xl shadow-2xl p-12 border border-gray-200 dark:border-gray-800 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaWallet className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Your Passport
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Connect your wallet to access your digital identity and achievements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-muted dark:bg-muted rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <FaShieldAlt className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Secure Identity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your digital passport secured by blockchain technology
            </p>
          </div>

          <div className="bg-muted dark:bg-muted rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <FaLink className="w-8 h-8 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Social Connections
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Link your social accounts and build your reputation
            </p>
          </div>

          <div className="bg-muted dark:bg-muted rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <FaRocket className="w-8 h-8 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Achievements
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your progress and unlock new opportunities
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Ready to get started?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Petra wallet to create and manage your digital passport
          </p>

          {/* Connect Wallet Button */}
          <button
            onClick={connect}
            disabled={connecting}
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
          >
            {connecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Connecting...
              </>
            ) : (
              <>
                <FaWallet className="w-5 h-5 mr-3" />
                Connect Petra Wallet
              </>
            )}
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 space-y-1">
            <p>📱 Install Petra Wallet extension</p>
            <p>🔗 Click "Connect Petra Wallet" above</p>
            <p>✨ Start building your digital identity</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Passport Overview Component
function PassportOverview({
  userData,
  account,
  totalScore,
  walletLinks,
}: {
  userData: UserData;
  account: any;
  totalScore: number;
  walletLinks: WalletLink[];
}) {
  const { toast } = useToast();

  return (
    <div className="bg-[#0B0E14] rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-800">
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
              {userData.primaryWallet
                ? `${userData.primaryWallet.slice(
                  0,
                  6
                )}...${userData.primaryWallet.slice(-4)}`
                : "No wallet provided"}
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
      <div className="bg-gray-50 dark:bg-[#0B0E14] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <FaWallet className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wallet Connections
          </h3>
        </div>

        {/* Current Session Wallet */}
        {account?.address && (
          <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Current Session
                </p>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border">
                  {truncateAddress(account.address.toString())}
                </code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(account.address.toString());
                  toast({
                    title: "Success",
                    description: "Address copied to clipboard",
                  });
                }}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Verified Wallets */}
        {walletLinks.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Verified Wallets
            </p>
            <div className="space-y-2">
              {walletLinks.map((wallet, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500 shadow-green-200 dark:shadow-green-800"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${wallet.isPrimary ? "bg-green-500" : "bg-gray-400"
                        }`}
                    ></div>
                    <div>
                      <code className="text-sm font-mono text-gray-900 dark:text-white">
                        {truncateAddress(wallet.address)}
                      </code>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {wallet.network} {wallet.isPrimary && "• Primary"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Verified
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(wallet.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!account?.address && walletLinks.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No wallets connected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Social Connections Component
function SocialConnections({
  socialLinks,
  loading,
  handleSocialLink,
  handleSocialUnlink,
}: {
  socialLinks: SocialLink[];
  loading: string | null;
  handleSocialLink: (provider: "google" | "twitter" | "github") => void;
  handleSocialUnlink: (provider: "google" | "twitter" | "github") => void;
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
    return socialLinks.some((link) => link.provider === provider);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const getProviderPoints = (provider: string, link: any) => {
    if (provider === "google") return 1;
    if (provider === "twitter") return 1.5;
    if (provider === "github") {
      // Assume link.commitsDays is available, otherwise default to 0
      const days = link.commitsDays || 0;
      if (days >= 120) return 2.3;
      if (days >= 60) return 1.9;
      if (days >= 30) return 1.9;
      return 0;
    }
    return 0;
  };
  return (
    <div className="bg-[#0B0E14] rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <FaLink className="w-5 h-5 mr-3 text-blue-600" />
        Social Connections
      </h3>

      {/* Connected Accounts */}
      {socialLinks.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Connected Accounts
          </h4>
          <div className="space-y-3">
            {socialLinks.map((link, index) => (
              <div
                key={`${link.provider}-${link.socialId}-${index}`}
                className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-700 hover:border-green-500 animate-in slide-in-from-top duration-300"
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
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white mb-1">Points gained</div>
                    <div className="text-2xl font-bold text-teal-400">{getProviderPoints(link.provider, link)}</div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ Verified
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(link.verifiedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleSocialUnlink(
                        link.provider as "google" | "twitter" | "github"
                      )
                    }
                    disabled={loading !== null}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-full transition-colors duration-200 disabled:opacity-50"
                  >
                    {loading === link.provider ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700 dark:border-red-400"></div>
                    ) : (
                      "Unlink"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 text-center py-8">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Social Accounts
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            Link your Google, Twitter, and GitHub accounts to build your digital
            identity and earn reputation scores.
          </p>
        </div>
      )}

      {/* Available Connections */}
      <div>
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          Available Connections
        </h4>
        <div className="space-y-3">
          {["google", "twitter", "github"]
            .filter((provider) => !isProviderLinked(provider)) // Only show unlinked providers
            .map((provider) => (
              <button
                key={provider}
                onClick={() =>
                  handleSocialLink(provider as "google" | "twitter" | "github")
                }
                disabled={loading !== null}
                className="w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  {getSocialIcon(provider)}
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    Connect {provider}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {loading === provider && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </button>
            ))}
          {/* Show message when no providers available to connect */}
          {["google", "twitter", "github"].filter(
            (provider) => !isProviderLinked(provider)
          ).length === 0 && (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaTrophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  🎉 All social accounts connected!
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  You're all set. Your digital passport is complete.
                </p>
              </div>
            )}
          {/* Show message when there are providers available but none connected yet */}
          {socialLinks.length === 0 &&
            ["google", "twitter", "github"].filter(
              (provider) => !isProviderLinked(provider)
            ).length > 0 && (
              <div className="text-center py-4 mb-4">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                  👆 Choose a platform to get started
                </p>
              </div>
            )}
        </div>

        {/* Debug Info in Development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
            <p className="font-semibold mb-1">Debug Info:</p>
            <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
            <p>Connected Links: {socialLinks.length}</p>
            <p>Loading: {loading || "none"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Achievement History Component
function AchievementHistory({ scoreHistory }: { scoreHistory: ScoreEntry[] }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-[#0B0E14] rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <FaTrophy className="w-5 h-5 mr-3 text-yellow-500" />
        Achievement History
      </h3>

      {scoreHistory.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {scoreHistory.map((entry) => (
            <div
              key={entry._id}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                    {typeof entry.badge === "string"
                      ? entry.badge.replace("_", " ").toUpperCase()
                      : "BADGE"}
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
  const {
    account,
    connected,
    handleWalletLogin,
    authenticated,
    userData: walletUserData,
  } = useWallet();
  const router = useRouter();
  const api = useAuthenticatedApi();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [walletLinks, setWalletLinks] = useState<WalletLink[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [autoLoginTriggered, setAutoLoginTriggered] = useState(false);

  // Auto login when wallet connects
  useEffect(() => {
    if (connected && account && !authenticated && !autoLoginTriggered) {
      const accessToken = localStorage.getItem("accessToken");

      // If we have a valid token, don't auto-trigger login
      if (accessToken) {
        console.log("Found existing access token, skipping auto login");
        return;
      }

      console.log("Wallet connected, starting auto login...");
      setAutoLoginTriggered(true);
      handleWalletLogin()
        .then(() => {
          console.log("Auto login completed");
        })
        .catch((error: any) => {
          console.error("Auto login failed:", error);
          setAutoLoginTriggered(false); // Reset on failure
        });
    }

    if (!connected) {
      setAutoLoginTriggered(false); // Reset when disconnected
    }
  }, [
    connected,
    account,
    authenticated,
    autoLoginTriggered,
    handleWalletLogin,
  ]);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    console.log("Passport - Debug:", {
      accessToken: !!accessToken,
      connected,
      authenticated,
      walletUserData: !!walletUserData,
    });

    // Use wallet user data if available
    if (walletUserData) {
      setUserData(walletUserData);
    }

    // Only fetch passport data if authenticated OR if we have a valid access token
    if (
      (authenticated && accessToken) ||
      (!authenticated && accessToken && connected)
    ) {
      console.log("Fetching passport data...");
      fetchPassportData();
    } else if (!accessToken) {
      console.log("No access token found, setting data loading to false");
      setDataLoading(false);
    }
  }, [authenticated, walletUserData, connected]);

  // Additional effect to refresh data when authentication status changes
  useEffect(() => {
    if (authenticated && walletUserData) {
      console.log("Authentication completed, refreshing passport data...");
      setRefreshTrigger((prev) => prev + 1);
      fetchPassportData();
    }
  }, [authenticated]);

  // Check if we have valid token on page load/refresh
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken && connected && !authenticated) {
      console.log("Found access token on page load, attempting to validate...");
      // Try to fetch user data to validate token
      fetchPassportData().catch((error) => {
        console.error("Token validation failed:", error);
        localStorage.removeItem("accessToken");
        setDataLoading(false);
      });
    }
  }, [connected]);

  // Watch for refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("Refresh trigger activated:", refreshTrigger);
    }
  }, [refreshTrigger]);

  // Watch for socialLinks changes
  useEffect(() => {
    console.log("Social links updated:", socialLinks);
    // Clear loading state if social links are updated and we're not in a connecting process
    if (socialLinks.length > 0 && loading) {
      // Check if the provider we're loading is now connected
      const loadingProvider = loading as "google" | "twitter" | "github";
      if (socialLinks.some((link) => link.provider === loadingProvider)) {
        console.log(
          `Clearing loading state for ${loadingProvider} - connection detected`
        );
        setLoading(null);
      }
    }
  }, [socialLinks, loading]);

  // Clear any stale loading state on component mount
  useEffect(() => {
    // Clear loading state when component first mounts to prevent stuck loading states
    if (loading) {
      console.log("Clearing stale loading state on mount:", loading);
      setLoading(null);
    }
  }, []); // Only run on mount

  // Debug loading state changes
  useEffect(() => {
    console.log("Loading state changed:", loading);
  }, [loading]);

  const fetchPassportData = async () => {
    try {
      setDataLoading(true);

      // Fetch user data from /issuer/me to get the latest score information
      const userResponse = await api.get("/issuer/me");
      if (userResponse.status === 200) {
        console.log("User data fetched:", userResponse.data);
        setUserData(userResponse.data);
      }

      // Fetch social links
      const socialResponse = await api.get("/issuer/me/social-links");
      if (socialResponse.status === 200) {
        console.log("Social links fetched:", socialResponse.data);
        setSocialLinks([...socialResponse.data]); // Force new array reference
      }

      // Fetch wallet links
      const walletResponse = await api.get("/issuer/me/wallet-links");
      if (walletResponse.status === 200) {
        console.log("Wallet links fetched:", walletResponse.data);
        setWalletLinks([...walletResponse.data]); // Force new array reference
      }

      // Fetch score history
      const scoreResponse = await api.get("/issuer/me/score-history");
      if (scoreResponse.status === 200) {
        console.log("Score history fetched:", scoreResponse.data);
        setScoreHistory([...scoreResponse.data]); // Force new array reference
      }

      // Clear any loading state that might be stuck
      if (loading) {
        console.log("Clearing loading state after successful data fetch");
        setLoading(null);
      }
    } catch (error) {
      console.error("Error fetching passport data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load passport data",
      });
    } finally {
      setDataLoading(false);
    }
  };

  const handleSocialLink = async (
    provider: "google" | "twitter" | "github"
  ) => {
    console.log("handleSocialLink called with provider:", provider);
    setLoading(provider);
    let popupWindow: Window | null = null;
    let checkPopupInterval: NodeJS.Timeout | null = null;
    let messageTimeout: NodeJS.Timeout | null = null;
    let dataRefreshInterval: NodeJS.Timeout | null = null;

    // Add additional debugging for message events
    const debugMessageHandler = (event: MessageEvent) => {
      // Don't log MetaMask and other irrelevant messages
      if (
        event.data?.target === "metamask-inpage" ||
        event.data?.source === "metamask-inpage" ||
        event.data?.name === "metamask-provider" ||
        event.data?.type === "FROM_CONTENT_SCRIPT" ||
        event.data?.method?.includes("metamask") ||
        event.data?.method?.includes("wallet")
      ) {
        return;
      }

      console.log("Raw OAuth message received:", {
        data: event.data,
        origin: event.origin,
        source: event.source,
        type: typeof event.data,
      });
    };

    const cleanup = () => {
      if (checkPopupInterval) {
        clearInterval(checkPopupInterval);
      }
      if (messageTimeout) {
        clearTimeout(messageTimeout);
      }
      if (dataRefreshInterval) {
        clearInterval(dataRefreshInterval);
      }
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("message", debugMessageHandler);
      // Only set loading to null if it's still set to this provider
      if (loading === provider) {
        setLoading(null);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      // Ignore devtools messages
      if (
        event.data?.source === "react-devtools-bridge" ||
        event.data?.source === "react-devtools-content-script"
      ) {
        return;
      }

      // Ignore MetaMask and other extension messages
      if (
        event.data?.target === "metamask-inpage" ||
        event.data?.source === "metamask-inpage" ||
        event.data?.name === "metamask-provider" ||
        event.data?.type === "FROM_CONTENT_SCRIPT" ||
        event.data?.method?.includes("metamask") ||
        event.data?.method?.includes("wallet")
      ) {
        console.log("Ignoring wallet/extension message:", event.data);
        return;
      }

      console.log(
        "Received OAuth message:",
        event.data,
        "from origin:",
        event.origin
      );

      const allowedOrigins = [
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, ""),
        "http://localhost:3000",
        "http://localhost:8080",
        "https://crion.onrender.com",
        "https://basic-login-rose.vercel.app",
        window.location.origin,
      ].filter(Boolean);

      const isAllowedOrigin =
        process.env.NODE_ENV === "development" ||
        allowedOrigins.includes(event.origin);

      console.log("Origin check:", {
        origin: event.origin,
        allowed: allowedOrigins,
        isAllowed: isAllowedOrigin,
      });

      if (isAllowedOrigin && event.data) {
        // Handle both object and string responses
        let responseData = event.data;
        if (typeof event.data === "string") {
          try {
            responseData = JSON.parse(event.data);
          } catch {
            // If it's a string like "success" or "connected", treat it as success
            const successStrings = ["success", "connected", "linked", "ok"];
            responseData = {
              success: successStrings.includes(event.data.toLowerCase()),
            };
          }
        }

        console.log("Processed OAuth response data:", responseData);

        // Only process if it looks like an OAuth response
        if (typeof responseData === "object" && responseData !== null) {
          // Check if this is actually an OAuth-related message
          const isOAuthMessage =
            responseData.success !== undefined ||
            responseData.status !== undefined ||
            responseData.connected !== undefined ||
            responseData.linked !== undefined ||
            responseData.error !== undefined ||
            responseData.socialId !== undefined ||
            responseData.userId !== undefined ||
            responseData.email !== undefined ||
            // Explicitly check for OAuth success patterns
            (typeof responseData === "string" &&
              ["success", "connected", "linked", "error", "failed"].some(
                (keyword) => responseData.toLowerCase().includes(keyword)
              ));

          if (!isOAuthMessage) {
            console.log("Ignoring non-OAuth message:", responseData);
            return;
          }

          // More comprehensive success detection
          const isSuccess =
            responseData.success === true ||
            responseData.status === "success" ||
            responseData.status === "connected" ||
            responseData.status === "linked" ||
            responseData.connected === true ||
            responseData.linked === true ||
            responseData.status === 200 ||
            responseData.statusCode === 200 ||
            // If no explicit error and has user data, consider it a success
            (!responseData.error &&
              !responseData.message?.includes("error") &&
              (responseData.socialId ||
                responseData.userId ||
                responseData.id ||
                responseData.email));

          console.log("Is OAuth success:", isSuccess);

          if (isSuccess) {
            // Immediately update social links state to show the connection
            const newSocialLink: SocialLink = {
              provider: provider,
              socialId:
                responseData.socialId ||
                responseData.userId ||
                responseData.id ||
                `${provider}_${Date.now()}`,
              email: responseData.email || "",
              username: responseData.username || responseData.login || "",
              displayName:
                responseData.displayName ||
                responseData.name ||
                responseData.username ||
                "",
              profileUrl:
                responseData.profileUrl || responseData.html_url || "",
              verifiedAt: new Date().toISOString(),
            };
            setSocialLinks((prev) => [...prev, newSocialLink]);

            // Clear loading state immediately after UI update
            setLoading(null);

            toast({
              title: "Success",
              description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
                } account linked successfully`,
            });

            // Force immediate UI update
            setRefreshTrigger((prev) => prev + 1);

            // Refresh passport data to get real data from server (with shorter delay)
            console.log("Social link successful, refreshing data...");
            setTimeout(() => {
              fetchPassportData()
                .then(() => {
                  console.log("Data refreshed after social link");
                })
                .catch((error) => {
                  console.error("Error refreshing data:", error);
                });
            }, 100); // Even shorter delay for immediate feedback
          } else {
            console.error("Social link failed:", responseData);
            const errorMessage =
              responseData.error ||
              responseData.message ||
              responseData.error_description ||
              `Failed to link ${provider} account`;
            toast({
              variant: "destructive",
              title: "Error",
              description: errorMessage,
            });
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
        throw new Error("No access token found. Please login again.");
      }

      // Check if already linked
      if (socialLinks.some((link) => link.provider === provider)) {
        toast({
          title: "Already Connected",
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
            } account is already linked`,
        });
        setLoading(null);
        return;
      }

      const width = 600;
      const height = 700;
      const left = Math.max(
        0,
        (window.innerWidth - width) / 2 + window.screenX
      );
      const top = Math.max(
        0,
        (window.innerHeight - height) / 2 + window.screenY
      );
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
      window.addEventListener("message", debugMessageHandler);

      // Build the auth URL
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
        window.location.origin;
      const authUrl = `${baseUrl}/api/v1/issuer/me/link/${provider}`;
      const urlWithToken = `${authUrl}?accessToken=${encodeURIComponent(
        accessToken
      )}&origin=${encodeURIComponent(window.location.origin)}`;

      console.log(`Opening ${provider} auth popup:`, urlWithToken);

      popupWindow = window.open(urlWithToken, `${provider}_auth`, features);

      if (!popupWindow) {
        throw new Error(
          "Popup was blocked. Please allow popups for this site and try again."
        );
      }

      // Focus the popup
      popupWindow.focus();

      // Periodically check for successful connection by refreshing data
      let lastLinkCount = socialLinks.length;
      const wasLinkedInitially = socialLinks.some(
        (link) => link.provider === provider
      );

      dataRefreshInterval = setInterval(async () => {
        if (popupWindow?.closed) return;

        try {
          await fetchPassportData();

          // Check if provider is now linked when it wasn't before
          const isNowLinked = socialLinks.some(
            (link) => link.provider === provider
          );

          if (!wasLinkedInitially && isNowLinked) {
            // New link detected!
            console.log("New social link detected via periodic refresh");
            cleanup();
            if (popupWindow && !popupWindow.closed) {
              popupWindow.close();
            }
            toast({
              title: "Success",
              description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
                } account linked successfully`,
            });
            return;
          }
        } catch (error) {
          console.log("Error during periodic data refresh:", error);
        }
      }, 3000); // Check every 3 seconds

      // Check if popup is closed periodically
      checkPopupInterval = setInterval(() => {
        if (popupWindow?.closed) {
          console.log("Popup closed, checking if connection was successful...");
          cleanup();

          // When popup closes, wait a moment then check if the connection was successful
          // by refetching data and comparing social links
          setTimeout(async () => {
            const initialLinksCount = socialLinks.length;
            const wasAlreadyLinked = socialLinks.some(
              (link) => link.provider === provider
            );

            try {
              console.log(
                "Fetching updated passport data to check connection status..."
              );
              await fetchPassportData();

              // Check if a new link was added after the popup closed
              setTimeout(() => {
                const newLinksCount = socialLinks.length;
                const isNowLinked = socialLinks.some(
                  (link) => link.provider === provider
                );

                if (!wasAlreadyLinked && isNowLinked) {
                  console.log(
                    "Connection successful - detected via data refresh"
                  );
                  toast({
                    title: "Success",
                    description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
                      } account linked successfully`,
                  });
                } else if (loading === provider) {
                  console.log("Connection may have been cancelled or failed");
                  toast({
                    title: "Cancelled",
                    description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
                      } linking was cancelled or failed`,
                  });
                }
              }, 500); // Give time for state to update
            } catch (error) {
              console.error("Error checking connection status:", error);
              if (loading === provider) {
                toast({
                  title: "Cancelled",
                  description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
                    } linking was cancelled`,
                });
              }
            }
          }, 500); // Wait a bit before checking
        } else if (popupWindow) {
          // Check popup URL for success indicators
          try {
            const popupUrl = popupWindow.location.href;
            console.log("Popup URL:", popupUrl);

            // Check if URL indicates success
            if (
              popupUrl.includes("success") ||
              popupUrl.includes("connected") ||
              popupUrl.includes("linked") ||
              popupUrl.includes("callback") ||
              popupUrl !== "about:blank"
            ) {
              console.log("Success detected via URL");
              cleanup();

              // Show immediate success feedback
              toast({
                title: "Success",
                description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
                  } account linked successfully`,
              });

              // Refresh data
              setTimeout(() => {
                fetchPassportData()
                  .then(() => {
                    console.log("Data refreshed after URL-detected success");
                  })
                  .catch((error) => {
                    console.error("Error refreshing data:", error);
                  });
              }, 200);

              if (popupWindow && !popupWindow.closed) {
                popupWindow.close();
              }
            }
          } catch (error) {
            // Cross-origin error is expected, ignore it
            console.log("Cannot access popup URL (cross-origin)");
          }
        }
      }, 1000);

      // Set a timeout to clean up after 5 minutes
      messageTimeout = setTimeout(() => {
        cleanup();
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
        toast({
          variant: "destructive",
          title: "Timeout",
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
            } linking timed out. Please try again.`,
        });
      }, 5 * 60 * 1000); // 5 minutes
    } catch (error) {
      console.error(`${provider} linking error:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to link ${provider} account`,
      });
      cleanup();
    }
  };

  const handleSocialUnlink = async (
    provider: "google" | "twitter" | "github"
  ) => {
    console.log("handleSocialUnlink called with provider:", provider);
    if (
      !confirm(
        `Are you sure you want to unlink your ${provider.charAt(0).toUpperCase() + provider.slice(1)
        } account?`
      )
    ) {
      return;
    }

    setLoading(provider);
    try {
      const response = await api.post(`/issuer/me/unlink/${provider}`);
      console.log("Unlink response:", response);

      // Check for successful response - be more flexible with response format
      const isSuccess =
        response.success === true ||
        response.status === "success" ||
        response.status === 200 ||
        response.data?.success === true ||
        response.data?.status === "success" ||
        (!response.error && !response.data?.error);

      if (isSuccess) {
        // Immediately remove the social link from state
        setSocialLinks((prev) =>
          prev.filter((link) => link.provider !== provider)
        );

        toast({
          title: "Success",
          description: `${provider.charAt(0).toUpperCase() + provider.slice(1)
            } account unlinked successfully`,
        });

        // Force immediate UI update
        setRefreshTrigger((prev) => prev + 1);

        // Refresh data to get updated data from server (shorter delay)
        setTimeout(() => {
          fetchPassportData()
            .then(() => {
              console.log("Data refreshed after social unlink");
            })
            .catch((error) => {
              console.error("Error refreshing data after unlink:", error);
            });
        }, 200); // Much shorter delay since we already updated the UI
      } else {
        const errorMessage =
          response.error ||
          response.data?.error ||
          response.message ||
          response.data?.message ||
          "Unlink failed";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error(`${provider} unlinking error:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to unlink ${provider} account`,
      });
    } finally {
      setLoading(null);
    }
  };

  const getTotalScore = () => {
    // Prioritize the score from the latest user data fetched from /issuer/me
    if (userData?.score?.totalScore !== undefined) {
      return userData.score.totalScore;
    }
    // Fallback to score history calculation if user data doesn't have score
    return scoreHistory.reduce(
      (total: number, entry: ScoreEntry) => total + entry.totalScore,
      0
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <style jsx>{`
        .hover-grid {
          position: relative;
          overflow: hidden;
        }

        .hover-grid::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transform: translateX(50%) translateY(50%);
          transition: all 0.5s ease;
          background: radial-gradient(
              circle at bottom right,
              rgba(255, 255, 255, 0.08) 15%,
              rgba(255, 255, 255, 0.04) 35%,
              transparent 55%
            ),
            linear-gradient(
              45deg,
              transparent 25%,
              rgba(255, 255, 255, 0.02) 45%,
              rgba(255, 255, 255, 0.05) 65%,
              rgba(255, 255, 255, 0.08) 85%
            ),
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 100% 100%, 100% 100%, 15px 15px, 15px 15px;
          background-position: 0 0, 0 0, bottom right, bottom right;
          pointer-events: none;
        }

        .hover-grid:hover::before {
          opacity: 1;
          transform: translateX(0%) translateY(0%);
        }

        .hover-grid button {
          position: relative;
          z-index: 10;
          pointer-events: auto;
        }
      `}</style>
      {!connected ? (
        // Show wallet connect prompt when wallet is not connected
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#0B0E14]">
            <WalletConnectPrompt />
          </div>
        </div>
      ) : !authenticated ? (
        // Show login prompt when wallet connected but not authenticated
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto bg-[#0B0E14] rounded-2xl shadow-xl p-8 border border-gray-700">
              <FaWallet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Authenticating...
              </h3>
              <p className="text-gray-400 mb-4">
                Please sign the message in your wallet to access your passport
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Waiting for wallet signature...</span>
              </div>
            </div>
          </div>
        </div>
      ) : dataLoading ? (
        // Show loading when fetching data
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your passport...</p>
            </div>
          </div>
        </div>
      ) : userData ? (
        // Show passport content when user data is available
        <>
          {" "}
          {/* Header Section - Simple Dark Design */}
          <div className="bg-[#0B0E14] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                {/* Left Side - Score Card */}
                <div className="relative">
                  <div className="bg-gray-800 border border-orange-500/30 rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">ℹ</span>
                      </div>{" "}
                      <h2 className="text-xl font-semibold text-teal-400">
                        Unique Humanity Score
                      </h2>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <div className="w-12 h-12 bg-[#0B0E14] rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 bg-orange-400 rounded-md"></div>
                        </div>
                      </div>
                      <div className="text-6xl font-bold text-teal-400">
                        {getTotalScore().toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Tips */}
                <div className="flex-1 lg:ml-12">
                  <h1 className="text-4xl font-bold mb-4">
                    Let's increase that score
                  </h1>
                  <a
                    href="#"
                    className="text-teal-400 underline text-lg hover:text-teal-300 transition-colors"
                  >
                    Here's some tips on how to raise your score to a minimum of
                    20.
                  </a>
                  <div className="mt-8">
                    <button className="bg-teal-400 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-teal-300 transition-colors">
                      Verify Stamps
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Main Content */}
          <div className="bg-[#0B0E14] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {/* Blockchain & Crypto Networks Section */}


              {/* Social & Professional Platforms Section */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Social & Professional Platforms
                    </h2>
                    <p className="text-teal-400">
                      Link your profiles from established social media and
                      professional networking sites for verification.
                    </p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* LinkedIn */}
                  <div className="hover-grid bg-[#0B0E14] border border-gray-600 rounded-2xl p-6 text-white transition-all duration-300 hover:border-gray-400 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-teal-400">
                          1.5
                        </div>
                        <div className="text-sm text-gray-300">
                          Available Points
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">LinkedIn</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      This stamp confirms that your LinkedIn account is verified
                      and includes a valid, verified email address.
                    </p>
                    <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl font-semibold transition-colors">
                      Connect
                    </button>
                  </div>

                  {/* Discord */}
                  <div className="hover-grid bg-[#0B0E14] border border-gray-600 rounded-2xl p-6 text-white transition-all duration-300 hover:border-gray-400 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-teal-400">
                          1
                        </div>
                        <div className="text-sm text-gray-300">
                          Available Points
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Discord</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      Connect your Discord account to Passport to identity and
                      reputation in Web3 communities.
                    </p>
                    <button className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl font-semibold transition-colors">
                      Coming Soon
                    </button>
                  </div>

                  {/* Twitter */}
                  <div
                    className={`hover-grid ${socialLinks.some((link) => link.provider === "twitter")
                      ? "bg-[#0B0E14] border-green-700 hover:border-green-500"
                      : "bg-[#0B0E14] border-blue-700 hover:border-blue-500"
                      } rounded-2xl p-6 text-white transition-all duration-300 cursor-pointer relative`}
                  >
                    {socialLinks.some(
                      (link) => link.provider === "twitter"
                    ) && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-teal-500 text-black px-2 py-1 rounded text-xs font-semibold">
                            Verified
                          </span>
                        </div>
                      )}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${socialLinks.some(
                          (link) => link.provider === "twitter"
                        )
                          ? "bg-green-600"
                          : "bg-blue-600"
                          } rounded-xl flex items-center justify-center`}
                      >
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        {socialLinks.some(
                          (link) => link.provider === "twitter"
                        ) ? (
                          <div>
                            <div className="text-lg font-bold text-white mb-1">
                              Points gained
                            </div>
                            <div className="text-2xl font-bold text-teal-400">
                              1.5
                            </div>
                            <div className="w-16 h-2 bg-gray-600 rounded-full mt-2">
                              <div className="w-1/2 h-full bg-teal-400 rounded-full"></div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold text-teal-400">
                              1.5
                            </div>
                            <div className="text-sm text-gray-300">
                              Available Points
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Twitter</h3>
                    {socialLinks.some((link) => link.provider === "twitter") ? (
                      <div className="text-sm text-gray-300 mb-4">
                        <div className="flex items-center mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-teal-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          64 days until Stamps expire
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 mb-4">
                        Connect your Twitter account to verify your social
                        presence.
                      </p>
                    )}
                    <button
                      onClick={() =>
                        socialLinks.some((link) => link.provider === "twitter")
                          ? handleSocialUnlink("twitter")
                          : handleSocialLink("twitter")
                      }
                      disabled={loading === "twitter"}
                      className={`w-full ${socialLinks.some((link) => link.provider === "twitter")
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                        } text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50`}
                    >
                      {loading === "twitter" ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {socialLinks.some(
                            (link) => link.provider === "twitter"
                          )
                            ? "Disconnecting..."
                            : "Connecting..."}
                        </div>
                      ) : socialLinks.some(
                        (link) => link.provider === "twitter"
                      ) ? (
                        "Disconnect"
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>

                  {/* GitHub - Blue-black when not connected, green-black when connected */}
                  <div
                    className={`hover-grid ${socialLinks.some((link) => link.provider === "github")
                      ? "bg-[#0B0E14] border-green-700 hover:border-green-500"
                      : "bg-[#0B0E14] border-blue-700 hover:border-blue-500"
                      } rounded-2xl p-6 text-white transition-all duration-300 cursor-pointer relative`}
                  >
                    {socialLinks.some((link) => link.provider === "github") && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-teal-500 text-black px-2 py-1 rounded text-xs font-semibold">
                          Verified
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${socialLinks.some((link) => link.provider === "github")
                          ? "bg-green-600"
                          : "bg-blue-600"
                          } rounded-xl flex items-center justify-center`}
                      >
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        {socialLinks.some(
                          (link) => link.provider === "github"
                        ) ? (
                          <div>
                            <div className="text-lg font-bold text-white mb-1">
                              Points gained
                            </div>
                            <div className="text-2xl font-bold text-teal-400">
                              3.8
                            </div>
                            <div className="w-16 h-2 bg-gray-600 rounded-full mt-2">
                              <div className="w-3/4 h-full bg-teal-400 rounded-full"></div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold text-teal-400">
                              3.8
                            </div>
                            <div className="text-sm text-gray-300">
                              Available Points
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Github</h3>
                    {socialLinks.some((link) => link.provider === "github") ? (
                      <div className="text-sm text-gray-300 mb-4">
                        <div className="flex items-center mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-teal-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          64 days until Stamps expire
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 mb-4">
                        Connect your GitHub account to verify your development
                        activity.
                      </p>
                    )}
                    <button
                      onClick={() =>
                        socialLinks.some((link) => link.provider === "github")
                          ? handleSocialUnlink("github")
                          : handleSocialLink("github")
                      }
                      disabled={loading === "github"}
                      className={`w-full ${socialLinks.some((link) => link.provider === "github")
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                        } text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50`}
                    >
                      {loading === "github" ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {socialLinks.some(
                            (link) => link.provider === "github"
                          )
                            ? "Disconnecting..."
                            : "Connecting..."}
                        </div>
                      ) : socialLinks.some(
                        (link) => link.provider === "github"
                      ) ? (
                        "Disconnect"
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>

                  {/* Google - Blue-black when not connected, green-black when connected */}
                  <div
                    className={`hover-grid ${socialLinks.some((link) => link.provider === "google")
                      ? "bg-[#0B0E14] border-green-700 hover:border-green-500"
                      : "bg-[#0B0E14] border-blue-700 hover:border-blue-500"
                      } rounded-2xl p-6 text-white transition-all duration-300 cursor-pointer relative`}
                  >
                    {socialLinks.some((link) => link.provider === "google") && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-teal-500 text-black px-2 py-1 rounded text-xs font-semibold">
                          Verified
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 ${socialLinks.some((link) => link.provider === "google")
                          ? "bg-green-600"
                          : "bg-blue-600"
                          } rounded-xl flex items-center justify-center`}
                      >
                        <svg
                          className="w-6 h-6"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      </div>
                      <div className="text-right">
                        {socialLinks.some(
                          (link) => link.provider === "google"
                        ) ? (
                          <div>
                            <div className="text-lg font-bold text-white mb-1">
                              Points gained
                            </div>
                            <div className="text-2xl font-bold text-teal-400">
                              1
                            </div>
                            <div className="w-16 h-2 bg-gray-600 rounded-full mt-2">
                              <div className="w-full h-full bg-teal-400 rounded-full"></div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-2xl font-bold text-teal-400">
                              1
                            </div>
                            <div className="text-sm text-gray-300">
                              Available Points
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Google</h3>
                    {socialLinks.some((link) => link.provider === "google") ? (
                      <div className="text-sm text-gray-300 mb-4">
                        <div className="flex items-center mb-2">
                          <svg
                            className="w-4 h-4 mr-2 text-teal-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          64 days until Stamps expire
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 mb-4">
                        Connect your Google account for identity verification.
                      </p>
                    )}
                    <button
                      onClick={() =>
                        socialLinks.some((link) => link.provider === "google")
                          ? handleSocialUnlink("google")
                          : handleSocialLink("google")
                      }
                      disabled={loading === "google"}
                      className={`w-full ${socialLinks.some((link) => link.provider === "google")
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                        } text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50`}
                    >
                      {loading === "google" ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {socialLinks.some(
                            (link) => link.provider === "google"
                          )
                            ? "Disconnecting..."
                            : "Connecting..."}
                        </div>
                      ) : socialLinks.some(
                        (link) => link.provider === "google"
                      ) ? (
                        "Disconnect"
                      ) : (
                        "Connect"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Achievement History */}
                <AchievementHistory scoreHistory={scoreHistory} />
              </div>
            </div>
          </div>
        </>
      ) : (
        // Show message when connected but no user data yet
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto bg-[#0B0E14] rounded-2xl shadow-xl p-8 border border-gray-700">
              <FaUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Complete Your Login
              </h3>
              <p className="text-gray-400 mb-4">
                Please sign the message in your wallet to access your passport
              </p>
              <div className="text-sm text-gray-400">
                The login process should start automatically
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
