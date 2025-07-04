"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    User,
    Wallet,
    Shield,
    Copy,
    Edit,
    CheckCircle,
    Clock,
    XCircle,
    Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

// Simple Badge component inline
const Badge = ({ children, className = "", variant = "default" }: {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "secondary" | "outline" | "destructive";
}) => {
    const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";
    const variantClasses = {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground"
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </div>
    );
};

export default function ProfilePage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const [copied, setCopied] = useState("");

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        toast({
            title: "Copied!",
            description: `${type} copied to clipboard`,
        });
        setTimeout(() => setCopied(""), 2000);
    };

    const getKycStatusColor = (status: string) => {
        switch (status) {
            case "verified":
                return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200";
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200";
            case "rejected":
                return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200";
        }
    };

    const getKycStatusIcon = (status: string) => {
        switch (status) {
            case "verified":
                return <CheckCircle className="h-4 w-4" />;
            case "pending":
                return <Clock className="h-4 w-4" />;
            case "rejected":
                return <XCircle className="h-4 w-4" />;
            default:
                return <Shield className="h-4 w-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Access Denied
                        </h2>
                        <p className="text-gray-600 text-center mb-6">
                            You need to connect your wallet and sign in to access your profile.
                        </p>
                        <Button onClick={() => window.location.href = "/"}>
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.primaryWallet}`;

    return (
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account information and preferences
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Info */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Basic Information
                        </CardTitle>
                        <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <img
                                src={avatarUrl}
                                alt={user.name}
                                className="h-16 w-16 rounded-full border-2 border-gray-200"
                            />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">
                                    {user.name || "Unnamed User"}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                    {user._id}
                                </p>
                            </div>
                        </div>

                        {user.bio ? (
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">{user.bio}</p>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                No bio added yet
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Staked Amount</label>
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
                                {user.stakedAmount.toLocaleString()} APT
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* KYC Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Verification Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">KYC Status</span>
                                <Badge
                                    variant="outline"
                                    className={getKycStatusColor(user.kycStatus.status)}
                                >
                                    {getKycStatusIcon(user.kycStatus.status)}
                                    <span className="ml-1 capitalize">{user.kycStatus.status}</span>
                                </Badge>
                            </div>

                            {user.kycStatus.status === "pending" && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        Your KYC verification is being processed. This may take 1-3 business days.
                                    </p>
                                </div>
                            )}

                            {user.kycStatus.status === "rejected" && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        Your KYC verification was rejected. Please contact support for more information.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                        Contact Support
                                    </Button>
                                </div>
                            )}

                            {user.kycStatus.status === "verified" && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        Your account is fully verified! You have access to all features.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Links */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Connected Wallets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {user.walletLinks.map((wallet, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium capitalize">{wallet.network}</span>
                                                {wallet.isPrimary && (
                                                    <Badge variant="secondary" className="text-xs">Primary</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                {`${wallet.address.slice(0, 10)}...${wallet.address.slice(-10)}`}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Verified: {new Date(wallet.verifiedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(wallet.address, "Address")}
                                    >
                                        {copied === "Address" ? (
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Social Links */}
                {user.socialLinks.length > 0 && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Social Links
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {user.socialLinks.map((link, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <span className="font-medium">{link.platform}</span>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{link.url}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                                <User className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
