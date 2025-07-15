"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import Breadcrumb from "@/components/ui/breadcrumb";

export default function TokenPage() {
    const connectedWallet = useConnectedWallet();

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb
                items={[
                    { label: "Token", isCurrentPage: true }
                ]}
                className="mb-6"
            />

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">Token Management</h1>
                    <p className="text-lg text-muted-foreground">
                        Create, manage, and trade tokens on the Aptos blockchain
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create Token */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">🚀</span>
                                Create Token
                            </CardTitle>
                            <CardDescription>
                                Launch your own fungible token with custom parameters
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Set token name, symbol, and supply</li>
                                <li>• Configure buy fees and decimals</li>
                                <li>• Automatic minting to creator</li>
                            </ul>
                            <Button
                                className="w-full"
                                onClick={() => window.location.href = '/token/create'}
                                disabled={!connectedWallet.connected}
                            >
                                {!connectedWallet.connected ? "Connect Wallet" : "Create New Token"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Manage Tokens */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">⚙️</span>
                                Manage Tokens
                            </CardTitle>
                            <CardDescription>
                                Mint additional tokens for your created tokens
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• View your created tokens</li>
                                <li>• Mint additional supply</li>
                                <li>• Monitor token metrics</li>
                            </ul>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => window.location.href = '/token/manage'}
                                disabled={!connectedWallet.connected}
                            >
                                {!connectedWallet.connected ? "Connect Wallet" : "Manage Your Tokens"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Trade Tokens */}
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-2xl">💰</span>
                                Trade Tokens
                            </CardTitle>
                            <CardDescription>
                                Buy and sell tokens from other creators
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Browse all available tokens</li>
                                <li>• Buy tokens with fees</li>
                                <li>• Mint your own tokens for free</li>
                            </ul>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => window.location.href = '/trade'}
                            >
                                Browse Marketplace
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Information Section */}
                <div className="mt-12 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>How It Works</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl mb-2">1️⃣</div>
                                    <h3 className="font-semibold mb-2">Create</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Set up your token with custom parameters and initial supply
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">2️⃣</div>
                                    <h3 className="font-semibold mb-2">Manage</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mint additional tokens to your wallet without fees as the creator
                                    </p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">3️⃣</div>
                                    <h3 className="font-semibold mb-2">Trade</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Others can buy your tokens with the fees you configured
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold mb-2">For Creators</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Free minting for token creators</li>
                                        <li>• Configurable buy fees (earn from trades)</li>
                                        <li>• Set maximum supply limits</li>
                                        <li>• Custom branding with icons and URLs</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">For Traders</h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Browse all available tokens</li>
                                        <li>• Transparent fee structure</li>
                                        <li>• Real-time supply tracking</li>
                                        <li>• Secure blockchain transactions</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {!connectedWallet.connected && (
                        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                                    <p className="text-muted-foreground">
                                        Connect your Aptos wallet to start creating and trading tokens
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
