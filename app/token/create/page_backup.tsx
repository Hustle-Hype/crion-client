"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";
import Breadcrumb from "@/components/ui/breadcrumb";

const CONTRACT_ADDRESS = "0x7d263f6b2532fbde3fde3a11ce687eb0288fcbf09387ed1b6eeb81b01d86c0eb";
const MODULE_NAME = "fa_factory";

interface TokenFormData {
    name: string;
    symbol: string;
    description: string;
    iconUrl: string;
    projectUrl: string;
    decimals: number;
    maxSupply: string;
    mintAmount: string;
    buyFee: string;
}

export default function CreateTokenPage() {
    const aptosWallet = useWallet();
    const connectedWallet = useConnectedWallet();
    const safeWallet = useSafeWallet();
    const [formData, setFormData] = useState<TokenFormData>({
        name: "",
        symbol: "",
        description: "",
        iconUrl: "",
        projectUrl: "",
        decimals: 8,
        maxSupply: "",
        mintAmount: "",
        buyFee: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Debug wallet state for token creation:", {
            aptosWalletConnected: aptosWallet.connected,
            aptosWalletAccount: aptosWallet.account,
            hasSignFunction: !!aptosWallet.signAndSubmitTransaction,
            isAuthenticated: connectedWallet.isAuthenticated,
            availableWallets: aptosWallet.wallets?.map(w => ({ name: w.name, readyState: w.readyState }))
        });

        // Check if user is authenticated first
        if (!connectedWallet.isAuthenticated) {
            toast({
                title: "Authentication required",
                description: "Please login first before creating tokens.",
                variant: "destructive",
            });
            return;
        }

        // IMPORTANT: We need the actual Aptos wallet to be connected for signing transactions
        if (!aptosWallet.connected || !aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
            console.log("Aptos wallet not properly connected for token creation, attempting to connect...");

            toast({
                title: "Connecting Aptos wallet",
                description: "Connecting your Aptos wallet for transaction signing...",
            });

            try {
                // Try to connect to the first available wallet (usually Petra if installed)
                if (aptosWallet.wallets && aptosWallet.wallets.length > 0) {
                    const petraWallet = aptosWallet.wallets.find(w => w.name === "Petra") || aptosWallet.wallets[0];
                    console.log("Trying to connect to:", petraWallet.name, "State:", petraWallet.readyState);

                    if (petraWallet.readyState !== "Installed") {
                        toast({
                            title: "Wallet not installed",
                            description: "Please install Petra wallet or another Aptos wallet to create tokens.",
                            variant: "destructive",
                        });
                        return;
                    }

                    await aptosWallet.connect(petraWallet.name);
                    console.log("Connected successfully for token creation!");

                    // Wait a bit for the connection to be established
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // Re-check connection state
                    console.log("After connection - wallet state:", {
                        connected: aptosWallet.connected,
                        account: aptosWallet.account,
                        hasSignFunction: !!aptosWallet.signAndSubmitTransaction
                    });

                    // Check if connection was successful
                    if (!aptosWallet.connected || !aptosWallet.account) {
                        throw new Error("Connection was not established properly");
                    }
                } else {
                    console.log("No wallets available");
                    toast({
                        title: "No wallet found",
                        description: "Please install Petra wallet or another Aptos wallet to create tokens.",
                        variant: "destructive",
                    });
                    return;
                }
            } catch (error: any) {
                console.error("Auto-connect failed for token creation:", error);
                toast({
                    title: "Wallet connection failed",
                    description: error.message || "Please manually connect your Aptos wallet using the wallet button in the header and try again.",
                    variant: "destructive",
                });
                return;
            }
        }

        // Final check - make sure we have everything needed for transaction
        console.log("Final pre-transaction wallet check:", {
            connected: aptosWallet.connected,
            account: aptosWallet.account?.address,
            hasSignFunction: !!aptosWallet.signAndSubmitTransaction
        });

        if (!aptosWallet.connected || !aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
            toast({
                title: "Wallet connection required",
                description: "Unable to connect to Aptos wallet. Please manually connect using the wallet button in the header.",
                variant: "destructive",
            });
            return;
        }

        // Additional safety check for wallet state
        if (typeof aptosWallet.signAndSubmitTransaction !== 'function') {
            toast({
                title: "Wallet function error",
                description: "Wallet signing function is not available. Please disconnect and reconnect your wallet.",
                variant: "destructive",
            });
            return;
        }

        if (!formData.name || !formData.symbol || !formData.maxSupply || !formData.mintAmount || !formData.buyFee) {
            toast({
                title: "Missing fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Additional safety check
            if (!aptosWallet.signAndSubmitTransaction) {
                throw new Error("Wallet does not support transaction signing");
            }

            const entryFunctionPayload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_token`,
                type_arguments: [],
                arguments: [
                    formData.symbol, // string: symbol
                    formData.name, // string: name
                    formData.iconUrl || "", // string: icon url
                    formData.projectUrl || "", // string: project url
                    formData.decimals, // u8: decimals
                    formData.maxSupply, // u64: max supply
                    formData.mintAmount, // u64: mint amount
                    formData.buyFee, // u64: buy fee
                ],
            } as any;

            console.log("=== TOKEN CREATION DEBUG ===");
            console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
            console.log("MODULE_NAME:", MODULE_NAME);
            console.log("formData:", formData);
            console.log("Payload để gửi:", entryFunctionPayload);

            // Validate payload before sending
            if (!entryFunctionPayload.function) {
                throw new Error("Function field is missing in payload");
            }

            console.log("Using safe wallet for token creation transaction");
            const response = await safeWallet.safeSignAndSubmitTransaction(entryFunctionPayload);

            console.log("Token creation response:", response);

            if (response?.hash) {
                toast({
                    title: "Token Created Successfully!",
                    description: (
                        <div className="space-y-2">
                            <p>Your token "{formData.name}" has been created.</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        window.open(
                                            `https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`,
                                            "_blank"
                                        );
                                    }}
                                >
                                    View on Explorer
                                </Button>
                            </div>
                        </div>
                    ),
                });

                // Reset form
                setFormData({
                    name: "",
                    symbol: "",
                    description: "",
                    iconUrl: "",
                    projectUrl: "",
                    decimals: 8,
                    maxSupply: "",
                    mintAmount: "",
                    buyFee: "",
                });
            }
        } catch (error: any) {
            console.error("Token creation error:", error);
            toast({
                title: "Failed to create token",
                description: error.message || "An error occurred while creating the token. Make sure your wallet is properly connected.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!connectedWallet.connected) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Create Token</h1>
                    <Card className="p-8">
                        <p className="text-lg mb-4">Please connect your wallet to create a token</p>
                        <p className="text-sm text-muted-foreground">
                            You need to connect your Aptos wallet to access token creation features.
                        </p>
                        {connectedWallet.isAuthenticated && connectedWallet.user && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You are logged in but need to connect your Aptos wallet for transactions.
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Breadcrumb
                items={[
                    { label: "Token", href: "/token" },
                    { label: "Create", isCurrentPage: true }
                ]}
                className="mb-6"
            />
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Create New Token</h1>

                <Card className="p-6">
                    <form onSubmit={handleCreateToken} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Token Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Lou1s Token"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="symbol">Token Symbol *</Label>
                                <Input
                                    id="symbol"
                                    name="symbol"
                                    placeholder="e.g., LOU1S"
                                    value={formData.symbol}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe your token..."
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="iconUrl">Icon URL</Label>
                            <Input
                                id="iconUrl"
                                name="iconUrl"
                                placeholder="https://example.com/icon.png"
                                value={formData.iconUrl}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="projectUrl">Project URL</Label>
                            <Input
                                id="projectUrl"
                                name="projectUrl"
                                placeholder="https://yourproject.com"
                                value={formData.projectUrl}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="decimals">Decimals</Label>
                                <Input
                                    id="decimals"
                                    name="decimals"
                                    type="number"
                                    min="0"
                                    max="18"
                                    value={formData.decimals}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxSupply">Max Supply *</Label>
                                <Input
                                    id="maxSupply"
                                    name="maxSupply"
                                    placeholder="1000000"
                                    value={formData.maxSupply}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mintAmount">Initial Mint *</Label>
                                <Input
                                    id="mintAmount"
                                    name="mintAmount"
                                    placeholder="1000"
                                    value={formData.mintAmount}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="buyFee">Buy Fee (basis points) *</Label>
                            <Input
                                id="buyFee"
                                name="buyFee"
                                placeholder="300"
                                value={formData.buyFee}
                                onChange={handleInputChange}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                300 = 3%, 100 = 1%, etc.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Creating Token..." : "Create Token"}
                        </Button>
                    </form>
                </Card>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Contract Information</h3>
                    <p className="text-sm text-muted-foreground">
                        Contract: {CONTRACT_ADDRESS}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Network: Testnet
                    </p>
                </div>
            </div>
        </div>
    );
}
