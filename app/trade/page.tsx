"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useUnifiedWallet } from "@/hooks/wallet/useUnifiedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumb from "@/components/ui/breadcrumb";

const CONTRACT_ADDRESS = "0x7d263f6b2532fbde3fde3a11ce687eb0288fcbf09387ed1b6eeb81b01d86c0eb";
const MODULE_NAME = "fa_factory";

export default function TradePage() {
    const aptosWallet = useWallet();
    const safeWallet = useSafeWallet();
    const connectedWallet = useConnectedWallet();
    const unifiedWallet = useUnifiedWallet();
    const [buyForm, setBuyForm] = useState({
        tokenSymbol: "",
        amount: "",
    });
    const [sellForm, setSellForm] = useState({
        tokenSymbol: "",
        amount: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const config = new AptosConfig({ network: Network.TESTNET });
    const aptos = new Aptos(config);

    const handleBuySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Debug wallet state:", {
            aptosWalletConnected: aptosWallet.connected,
            aptosWalletAccount: aptosWallet.account,
            connectedWalletConnected: connectedWallet.connected,
            connectedWalletAccount: connectedWallet.account,
            hasSignFunction: !!aptosWallet.signAndSubmitTransaction,
            isAuthenticated: connectedWallet.isAuthenticated,
            availableWallets: aptosWallet.wallets?.map(w => ({ name: w.name, readyState: w.readyState }))
        });

        // Check if user is authenticated first
        if (!connectedWallet.isAuthenticated) {
            toast({
                title: "Authentication required",
                description: "Please login first before making transactions.",
                variant: "destructive",
            });
            return;
        }

        // IMPORTANT: We need the actual Aptos wallet to be connected for signing transactions
        if (!aptosWallet.connected || !aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
            console.log("Aptos wallet not properly connected, attempting to connect...");

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
                            description: "Please install Petra wallet or another Aptos wallet to make transactions.",
                            variant: "destructive",
                        });
                        return;
                    }

                    await aptosWallet.connect(petraWallet.name);
                    console.log("Connected successfully!");

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
                        description: "Please install Petra wallet or another Aptos wallet to make transactions.",
                        variant: "destructive",
                    });
                    return;
                }
            } catch (error: any) {
                console.error("Auto-connect failed:", error);
                toast({
                    title: "Wallet connection failed",
                    description: error.message || "Please manually connect your Aptos wallet using the wallet button in the header and try again.",
                    variant: "destructive",
                });
                return;
            }
        }

        // Final check - make sure we have everything needed for transaction
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

        if (!buyForm.tokenSymbol || !buyForm.amount) {
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
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                type_arguments: [],
                arguments: [
                    buyForm.tokenSymbol, // string: symbol
                    buyForm.amount, // u64: amount
                ],
            } as any;

            console.log("Submitting transaction with payload:", entryFunctionPayload);            // Check if signAndSubmitTransaction function exists
            if (!aptosWallet.signAndSubmitTransaction) {
                throw new Error("Wallet does not support transaction signing. Please try reconnecting your wallet.");
            }

            // Use safe wallet wrapper instead of direct wallet calls
            console.log("=== BUY TRANSACTION DEBUG ===");
            console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
            console.log("MODULE_NAME:", MODULE_NAME);
            console.log("buyForm:", buyForm);
            console.log("Payload để gửi:", entryFunctionPayload);

            // Validate payload before sending
            if (!entryFunctionPayload.function) {
                throw new Error("Function field is missing in payload");
            }

            console.log("Using safe wallet for buy transaction");
            const response = await safeWallet.safeSignAndSubmitTransaction(entryFunctionPayload);

            console.log("Transaction response:", response);

            if (response?.hash) {
                toast({
                    title: "Buy Order Successful!",
                    description: (
                        <div className="space-y-2">
                            <p>You bought {buyForm.amount} {buyForm.tokenSymbol} tokens.</p>
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

                setBuyForm({ tokenSymbol: "", amount: "" });
            } else {
                throw new Error("Transaction failed - no hash received");
            }
        } catch (error: any) {
            console.error("Buy error:", error);
            toast({
                title: "Failed to buy tokens",
                description: error.message || "An error occurred while buying tokens. Make sure your wallet is properly connected.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSellSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("Debug wallet state for sell:", {
            aptosWalletConnected: aptosWallet.connected,
            aptosWalletAccount: aptosWallet.account,
            hasSignFunction: !!aptosWallet.signAndSubmitTransaction,
            isAuthenticated: connectedWallet.isAuthenticated,
        });

        // Check if user is authenticated first
        if (!connectedWallet.isAuthenticated) {
            toast({
                title: "Authentication required",
                description: "Please login first before making transactions.",
                variant: "destructive",
            });
            return;
        }

        // IMPORTANT: We need the actual Aptos wallet to be connected for signing transactions
        if (!aptosWallet.connected || !aptosWallet.account || !aptosWallet.signAndSubmitTransaction) {
            console.log("Aptos wallet not properly connected for sell...");

            toast({
                title: "Connecting Aptos wallet",
                description: "Connecting your Aptos wallet for transaction signing...",
            });

            try {
                if (aptosWallet.wallets && aptosWallet.wallets.length > 0) {
                    const petraWallet = aptosWallet.wallets.find(w => w.name === "Petra") || aptosWallet.wallets[0];
                    console.log("Trying to connect to:", petraWallet.name, "State:", petraWallet.readyState);

                    if (petraWallet.readyState !== "Installed") {
                        toast({
                            title: "Wallet not installed",
                            description: "Please install Petra wallet or another Aptos wallet to make transactions.",
                            variant: "destructive",
                        });
                        return;
                    }

                    await aptosWallet.connect(petraWallet.name);
                    console.log("Connected successfully for sell!");

                    // Wait a bit for the connection to be established
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // Check if connection was successful
                    if (!aptosWallet.connected || !aptosWallet.account) {
                        throw new Error("Connection was not established properly");
                    }
                } else {
                    toast({
                        title: "No wallet found",
                        description: "Please install Petra wallet or another Aptos wallet to make transactions.",
                        variant: "destructive",
                    });
                    return;
                }
            } catch (error: any) {
                console.error("Auto-connect failed for sell:", error);
                toast({
                    title: "Wallet connection failed",
                    description: error.message || "Please manually connect your Aptos wallet using the wallet button in the header and try again.",
                    variant: "destructive",
                });
                return;
            }
        }

        // Final check - make sure we have everything needed for transaction
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

        if (!sellForm.tokenSymbol || !sellForm.amount) {
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
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::sell_tokens`,
                type_arguments: [],
                arguments: [
                    sellForm.tokenSymbol, // string: symbol
                    sellForm.amount, // u64: amount
                ],
            } as any;

            console.log("Submitting sell transaction with payload:", entryFunctionPayload);            // Check if signAndSubmitTransaction function exists
            if (!aptosWallet.signAndSubmitTransaction) {
                throw new Error("Wallet does not support transaction signing. Please try reconnecting your wallet.");
            }

            // Use safe wallet wrapper for sell transaction
            console.log("=== SELL TRANSACTION DEBUG ===");
            console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
            console.log("MODULE_NAME:", MODULE_NAME);
            console.log("sellForm:", sellForm);
            console.log("Payload để gửi:", entryFunctionPayload);

            // Validate payload before sending
            if (!entryFunctionPayload.function) {
                throw new Error("Function field is missing in payload");
            }

            console.log("Using safe wallet for sell transaction");
            const response = await safeWallet.safeSignAndSubmitTransaction(entryFunctionPayload);

            console.log("Sell transaction response:", response);

            if (response?.hash) {
                toast({
                    title: "Sell Order Successful!",
                    description: (
                        <div className="space-y-2">
                            <p>You sold {sellForm.amount} {sellForm.tokenSymbol} tokens.</p>
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

                setSellForm({ tokenSymbol: "", amount: "" });
            } else {
                throw new Error("Transaction failed - no hash received");
            }
        } catch (error: any) {
            console.error("Sell error:", error);
            toast({
                title: "Failed to sell tokens",
                description: error.message || "An error occurred while selling tokens. Make sure your wallet is properly connected.",
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
                    <h1 className="text-3xl font-bold mb-4">Trade Tokens</h1>
                    <Card className="p-8">
                        <p className="text-lg mb-4">Please connect your wallet to start trading</p>
                        <p className="text-sm text-muted-foreground">
                            You need to connect your Aptos wallet to access trading features.
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
                    { label: "Trade", isCurrentPage: true }
                ]}
                className="mb-6"
            />
            <div className="max-w-2xl mx-auto">                <h1 className="text-3xl font-bold mb-8 text-center">Trade Tokens</h1>

                {/* Show wallet connection status */}
                {connectedWallet.isAuthenticated && !aptosWallet.connected && (
                    <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                    Wallet Connection Required
                                </p>                                    <p className="text-xs text-orange-600 dark:text-orange-300">
                                    You're logged in, but need to connect your Aptos wallet for transactions.
                                </p>
                                <button
                                    onClick={async () => {
                                        try {
                                            await unifiedWallet.connectUnified("Petra");
                                        } catch (error: any) {
                                            toast({
                                                title: "Connection failed",
                                                description: error.message || "Failed to connect wallet",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                    className="mt-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                                >
                                    Connect Aptos Wallet
                                </button>                                {/* Debug button to check authentication state */}
                                <button
                                    onClick={() => {
                                        console.log("=== DEBUG AUTH STATE ===");
                                        console.log("localStorage tokens:", {
                                            accessToken: localStorage.getItem("accessToken"),
                                            refreshToken: localStorage.getItem("refreshToken")
                                        });
                                        console.log("Auth context:", {
                                            isAuthenticated: connectedWallet.isAuthenticated,
                                            user: connectedWallet.user
                                        });
                                        console.log("Aptos wallet:", {
                                            connected: aptosWallet.connected,
                                            account: aptosWallet.account,
                                            signFunction: typeof aptosWallet.signAndSubmitTransaction,
                                            wallet: aptosWallet.wallet
                                        });

                                        // Try to verify wallet state
                                        if (aptosWallet.signAndSubmitTransaction && typeof aptosWallet.signAndSubmitTransaction === 'function') {
                                            console.log("✅ Wallet signing function is available");
                                        } else {
                                            console.log("❌ Wallet signing function is NOT available");
                                        }
                                    }}
                                    className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                                >
                                    Debug Auth
                                </button>                                {/* Wallet verification button */}
                                <button
                                    onClick={async () => {
                                        try {
                                            if (!aptosWallet.connected) {
                                                toast({
                                                    title: "Wallet not connected",
                                                    description: "Please connect your wallet first.",
                                                    variant: "destructive",
                                                });
                                                return;
                                            }

                                            if (!aptosWallet.signAndSubmitTransaction) {
                                                toast({
                                                    title: "Wallet function missing",
                                                    description: "Signing function not available. Try reconnecting.",
                                                    variant: "destructive",
                                                });
                                                return;
                                            }

                                            // Test payload creation
                                            const testPayload = {
                                                type: "entry_function_payload",
                                                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                                                type_arguments: [],
                                                arguments: ["TEST", "1"],
                                            };

                                            console.log("Test payload:", testPayload);

                                            toast({
                                                title: "Wallet verified",
                                                description: "Wallet is ready for transactions.",
                                            });
                                        } catch (error: any) {
                                            console.error("Wallet verification failed:", error);
                                            toast({
                                                title: "Wallet verification failed",
                                                description: error.message || "Please reconnect your wallet.",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                    className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                                >
                                    Verify Wallet
                                </button>

                                {/* Test Payload button */}
                                <button
                                    onClick={() => {
                                        const testPayload = {
                                            type: "entry_function_payload",
                                            function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                                            type_arguments: [],
                                            arguments: [buyForm.tokenSymbol || "TEST", buyForm.amount || "1"],
                                        };

                                        console.log("=== PAYLOAD TEST ===");
                                        console.log("Contract Address:", CONTRACT_ADDRESS);
                                        console.log("Module Name:", MODULE_NAME);
                                        console.log("Function:", testPayload.function);
                                        console.log("Full Payload:", testPayload);

                                        // Validate format
                                        const parts = testPayload.function.split("::");
                                        if (parts.length === 3) {
                                            console.log("✅ Function format is valid");
                                        } else {
                                            console.log("❌ Function format is invalid");
                                        }

                                        toast({
                                            title: "Payload Test",
                                            description: "Check console for payload details",
                                        });
                                    }}
                                    className="ml-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded"
                                >
                                    Test Payload
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Connection Status Indicator */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${unifiedWallet.status.authConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium">
                                    App Login: {unifiedWallet.status.authConnected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${unifiedWallet.status.aptosConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                <span className="text-sm font-medium">
                                    Aptos Wallet: {unifiedWallet.status.aptosConnected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${unifiedWallet.status.readyForTransactions ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <span className="text-sm font-medium">
                                    Ready for Transactions: {unifiedWallet.status.readyForTransactions ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {aptosWallet.connected && aptosWallet.account ? (
                                `${aptosWallet.account.address.toString().slice(0, 6)}...${aptosWallet.account.address.toString().slice(-4)}`
                            ) : connectedWallet.isAuthenticated && connectedWallet.account ? (
                                typeof connectedWallet.account.address === 'string' ?
                                    `${connectedWallet.account.address.slice(0, 6)}...${connectedWallet.account.address.slice(-4)}` :
                                    `${connectedWallet.account.address.toString().slice(0, 6)}...${connectedWallet.account.address.toString().slice(-4)}`
                            ) : (
                                'No wallet connected'
                            )}
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="buy" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="buy">Buy Tokens</TabsTrigger>
                        <TabsTrigger value="sell">Sell Tokens</TabsTrigger>
                    </TabsList>

                    <TabsContent value="buy">
                        <Card className="p-6">
                            <form onSubmit={handleBuySubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="buyTokenSymbol">Token Symbol *</Label>
                                    <Input
                                        id="buyTokenSymbol"
                                        placeholder="e.g., LOU1S"
                                        value={buyForm.tokenSymbol}
                                        onChange={(e) => setBuyForm(prev => ({ ...prev, tokenSymbol: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="buyAmount">Amount (in smallest units) *</Label>
                                    <Input
                                        id="buyAmount"
                                        placeholder="e.g., 100000000"
                                        value={buyForm.amount}
                                        onChange={(e) => setBuyForm(prev => ({ ...prev, amount: e.target.value }))}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter amount in the token's smallest units (considering decimals)
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Buying..." : "Buy Tokens"}
                                </Button>
                            </form>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sell">
                        <Card className="p-6">
                            <form onSubmit={handleSellSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="sellTokenSymbol">Token Symbol *</Label>
                                    <Input
                                        id="sellTokenSymbol"
                                        placeholder="e.g., LOU1S"
                                        value={sellForm.tokenSymbol}
                                        onChange={(e) => setSellForm(prev => ({ ...prev, tokenSymbol: e.target.value }))}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sellAmount">Amount (in smallest units) *</Label>
                                    <Input
                                        id="sellAmount"
                                        placeholder="e.g., 1000"
                                        value={sellForm.amount}
                                        onChange={(e) => setSellForm(prev => ({ ...prev, amount: e.target.value }))}
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter amount in the token's smallest units (considering decimals)
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Selling..." : "Sell Tokens"}
                                </Button>
                            </form>
                        </Card>
                    </TabsContent>
                </Tabs>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Trading Information</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                        Contract: {CONTRACT_ADDRESS}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                        Network: Testnet
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Make sure you have sufficient APT for transaction fees
                    </p>
                </div>
            </div>
        </div>
    );
}
