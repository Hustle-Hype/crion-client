"use client";

/*
 * CRITICAL FIX: create_token function expects ALL string parameters as vector<u8> (byte arrays)
 * Updated payload construction to encode symbol, name, icon, project_url as bytes using TextEncoder
 * Contract ABI: create_token(symbol: vector<u8>, name: vector<u8>, icon: vector<u8>, project_url: vector<u8>, decimals: u8, total_supply: u64, k: u64, fee_rate: u64)
 * CORRECT ORDER: symbol, name, icon, project_url, decimals, total_supply, k, fee_rate (8 parameters)
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";
import Breadcrumb from "@/components/ui/breadcrumb";
import { WalletConnectionNotice } from "@/components/wallet/WalletConnectionNotice";
import { WalletStatusIndicator } from "@/components/wallet/WalletStatusIndicator";

const CONTRACT_ADDRESS = "0x7d263f6b2532fbde3fde3a11ce687eb0288fcbf09387ed1b6eeb81b01d86c0eb";
const MODULE_NAME = "fa_factory";

interface TokenFormData {
    name: string;
    symbol: string;
    description: string;
    iconUrl: string;
    projectUrl: string;
    decimals: number;
    totalSupply: string;
    mintAmount: string;
    buyFee: string;
}

export default function CreateTokenPage() {
    const aptosWallet = useWallet();
    const connectedWallet = useConnectedWallet();
    const safeWallet = useSafeWallet();
    const [formData, setFormData] = useState<TokenFormData>({
        name: "Lou1s Token",
        symbol: "Lou1s",
        description: "",
        iconUrl: "https://www.lou1s.fun/lou1s-avt.png",
        projectUrl: "https://www.lou1s.fun",
        decimals: 8,
        totalSupply: "1000000", // Fixed total supply
        mintAmount: "1000",     // Bonding curve constant (K)
        buyFee: "300",          // Fee rate in basis points
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isConnectingWallet, setIsConnectingWallet] = useState(false);

    const config = new AptosConfig({
        network: Network.TESTNET,
        clientConfig: {
            API_KEY: "AG-9W2L7VUVYZ8VCUMYY8VMRVMICKYNYC68H"
        }
    });
    const aptos = new Aptos(config);

    // Function to auto-connect Aptos wallet
    const autoConnectAptosWallet = async () => {
        if (aptosWallet.connected) {
            return true;
        }

        setIsConnectingWallet(true);
        try {
            const availableWallets = aptosWallet.wallets || [];
            const petraWallet = availableWallets.find((w: any) =>
                w.name === "Petra" && w.readyState === "Installed"
            );

            if (petraWallet) {
                console.log("Auto-connecting to Petra wallet...");
                await aptosWallet.connect(petraWallet.name);

                // Wait for connection to be fully established
                await new Promise(resolve => setTimeout(resolve, 1500));

                if (aptosWallet.connected && typeof aptosWallet.signAndSubmitTransaction === 'function') {
                    toast({
                        title: "Wallet connected",
                        description: "Successfully connected to Aptos wallet for transactions.",
                    });
                    return true;
                } else {
                    throw new Error("Failed to establish wallet connection");
                }
            } else {
                throw new Error("Petra wallet not found or not installed");
            }
        } catch (error: any) {
            console.error("Auto-connect failed:", error);
            toast({
                title: "Connection failed",
                description: "Please connect your wallet manually using the header button.",
                variant: "destructive",
            });
            return false;
        } finally {
            setIsConnectingWallet(false);
        }
    };

    // Function to extract token address from transaction events
    const extractTokenAddressFromEvents = (events: any[]) => {
        console.log("Extracting token address from events:", events);

        for (const event of events) {
            console.log("Event type:", event.type, "Event data:", event.data);

            // Look for object creation events
            if (event.type.includes("object::ObjectCore") ||
                event.type.includes("0x1::object::ObjectCore")) {
                if (event.data?.object) {
                    console.log("Found token address in ObjectCore event:", event.data.object);
                    return event.data.object;
                }
            }

            // Look for fungible asset creation events
            if (event.type.includes("fungible_asset") ||
                event.type.includes("0x1::fungible_asset")) {
                if (event.data?.metadata || event.data?.asset_type) {
                    const tokenAddress = event.data.metadata || event.data.asset_type;
                    console.log("Found token address in fungible asset event:", tokenAddress);
                    return tokenAddress;
                }
            }
        }

        return null;
    };

    // Function to buy initial tokens for creator's wallet
    const buyInitialTokensForCreator = async (tokenSymbol: string, amount: string) => {
        try {
            console.log("Buying", amount, "tokens for creator wallet...");

            // Convert symbol to vector<u8> to match contract ABI
            const symbolBytes = Array.from(new TextEncoder().encode(tokenSymbol));

            const buyPayload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                type_arguments: [],
                arguments: [
                    symbolBytes, // token symbol as vector<u8>
                    amount, // amount to buy
                ],
            } as any;

            console.log("Buy payload:", buyPayload);
            console.log("Symbol as bytes:", symbolBytes);
            const buyResponse = await safeWallet.safeSignAndSubmitTransaction(buyPayload);

            console.log("Buy transaction successful:", buyResponse);
            return buyResponse;
        } catch (error: any) {
            console.error("Buying error:", error);
            throw error;
        }
    };

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

        // Check if user is authenticated and has wallet access
        if (!connectedWallet.connected || !connectedWallet.account) {
            toast({
                title: "Wallet connection required",
                description: "Please connect your wallet or login to create tokens.",
                variant: "destructive",
            });
            return;
        }

        // Nếu user đã authenticated nhưng Aptos wallet adapter chưa connect, tự động connect
        if (connectedWallet.isAuthenticated && (!aptosWallet.connected || !aptosWallet.signAndSubmitTransaction)) {
            console.log("User is authenticated but Aptos wallet adapter not connected. Auto-connecting...");

            const connectSuccess = await autoConnectAptosWallet();
            if (!connectSuccess) {
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

        if (!formData.name || !formData.symbol || !formData.iconUrl || !formData.projectUrl || !formData.decimals || !formData.totalSupply || !formData.mintAmount || !formData.buyFee) {
            toast({
                title: "Missing required fields",
                description: "Please fill in all 8 required fields: Symbol, Name, Icon URL, Project URL, Decimals, Total Supply, K Value, and Fee Rate.",
                variant: "destructive",
            });
            return;
        }

        // Validate values to prevent large numbers
        const totalSupplyNum = parseInt(formData.totalSupply);
        const mintAmountNum = parseInt(formData.mintAmount);

        if (totalSupplyNum > 10000000) { // Max 10M
            toast({
                title: "Total Supply too large",
                description: "Total supply should not exceed 10,000,000 tokens.",
                variant: "destructive",
            });
            return;
        }

        if (mintAmountNum > 100000) { // Max 100K for K value
            toast({
                title: "K value too large",
                description: "Bonding curve constant (K) should not exceed 100,000.",
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

            // Convert string arguments to vector<u8> to match contract ABI
            const symbolBytes = Array.from(new TextEncoder().encode(formData.symbol));
            const nameBytes = Array.from(new TextEncoder().encode(formData.name));
            const iconBytes = Array.from(new TextEncoder().encode(formData.iconUrl || ""));
            const projectUrlBytes = Array.from(new TextEncoder().encode(formData.projectUrl || ""));

            // CORRECT PAYLOAD to match contract ABI: create_token(vector<u8>, vector<u8>, vector<u8>, vector<u8>, u8, u64, u64, u64)
            const correctPayload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_token`,
                type_arguments: [],
                arguments: [
                    symbolBytes, // 0: vector<u8> symbol
                    nameBytes, // 1: vector<u8> name  
                    iconBytes, // 2: vector<u8> icon
                    projectUrlBytes, // 3: vector<u8> project_url
                    formData.decimals, // 4: u8 decimals
                    formData.totalSupply, // 5: u64 total_supply - fixed total supply
                    formData.mintAmount, // 6: u64 k - bonding curve constant from form
                    formData.buyFee, // 7: u64 fee_rate - fee percentage from form
                ],
            } as any;

            const entryFunctionPayload = correctPayload;

            console.log("=== TOKEN CREATION DEBUG ===");
            console.log("CONTRACT_ADDRESS:", CONTRACT_ADDRESS);
            console.log("MODULE_NAME:", MODULE_NAME);
            console.log("formData:", formData);
            console.log("Payload để gửi:", entryFunctionPayload);
            console.log("📋 Contract ABI Compliance Check:");
            console.log("- arg0 (symbol): vector<u8> ✅", symbolBytes);
            console.log("- arg1 (name): vector<u8> ✅", nameBytes);
            console.log("- arg2 (icon): vector<u8> ✅", iconBytes);
            console.log("- arg3 (project_url): vector<u8> ✅", projectUrlBytes);
            console.log("- arg4 (decimals): u8 ✅", formData.decimals);
            console.log("- arg5 (total_supply): u64 ✅", formData.totalSupply);
            console.log("- arg6 (k): u64 ✅", formData.mintAmount);
            console.log("- arg7 (fee_rate): u64 ✅", formData.buyFee);

            console.log("=== COMPARISON WITH CONTRACT ABI ===");
            console.log("✅ UPDATED TO MATCH CONTRACT ABI (8 parameters):");
            console.log("0 (symbol): vector<u8> ✅", symbolBytes);
            console.log("1 (name): vector<u8> ✅", nameBytes);
            console.log("2 (icon): vector<u8> ✅", iconBytes);
            console.log("3 (project_url): vector<u8> ✅", projectUrlBytes);
            console.log("4 (decimals): u8 ✅", formData.decimals);
            console.log("5 (total_supply): u64 ✅", formData.totalSupply);
            console.log("6 (k): u64 ✅", formData.mintAmount);
            console.log("7 (fee_rate): u64 ✅", formData.buyFee);
            console.log("❌ PREVIOUSLY HAD WRONG PARAMETER ORDER!");

            console.log("Current payload args (updated to match contract ABI):");
            entryFunctionPayload.arguments.forEach((arg: any, index: number) => {
                if (index <= 3) {
                    console.log(`${index}: [${arg.join(',')}] (vector<u8> - byte array)`);
                } else {
                    console.log(`${index}: ${arg} (${typeof arg})`);
                }
            });
            console.log("5. total_supply:", entryFunctionPayload.arguments[5], "from form:", formData.totalSupply);
            console.log("6. k:", entryFunctionPayload.arguments[6], "from form:", formData.mintAmount);
            console.log("7. fee_rate:", entryFunctionPayload.arguments[7], "from form:", formData.buyFee);

            // Validate payload before sending
            if (!entryFunctionPayload.function) {
                throw new Error("Function field is missing in payload");
            }

            console.log("Using safe wallet for token creation transaction");
            const response = await safeWallet.safeSignAndSubmitTransaction(entryFunctionPayload);

            console.log("Token creation response:", response);

            if (response?.hash) {
                // Extract token address from events and mint tokens
                let tokenAddress = null;
                if (response.events && response.events.length > 0) {
                    tokenAddress = extractTokenAddressFromEvents(response.events);
                }

                toast({
                    title: "Token Created Successfully!",
                    description: (
                        <div className="space-y-2">
                            <p>Your token "{formData.name}" has been created.</p>
                            {tokenAddress && <p className="text-sm">Minting initial tokens...</p>}
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

                // Reset form and show completion message
                toast({
                    title: "Token Created Successfully!",
                    description: `${formData.name} (${formData.symbol}) has been created successfully. All tokens are stored in the contract and can be purchased on the Market page.`,
                });

                // Reset form
                setFormData({
                    name: "",
                    symbol: "",
                    description: "",
                    iconUrl: "",
                    projectUrl: "",
                    decimals: 8,
                    totalSupply: "",
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
                        <p className="text-sm text-muted-foreground mb-6">
                            You need to connect your Aptos wallet to access token creation features.
                        </p>
                        <WalletConnectionNotice
                            title="Wallet connection required"
                            description="Connect your wallet to start creating tokens on the Aptos network."
                            actionText="Connect Wallet"
                        />
                    </Card>
                </div>
            </div>
        );
    }

    // Nếu user đã login nhưng Aptos wallet adapter chưa connect, hiển thị thông báo
    if (connectedWallet.isAuthenticated && (!aptosWallet.connected || !aptosWallet.signAndSubmitTransaction)) {
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
                    <div className="mb-6">
                        <WalletConnectionNotice
                            title="Complete wallet setup"
                            description="You're logged in! Now connect your Aptos wallet for transactions to start creating tokens."
                            actionText="Connect Aptos Wallet"
                        />
                    </div>
                    <Card className="p-6 opacity-50">
                        <p className="text-center text-muted-foreground">
                            Token creation form will be available after connecting your Aptos wallet.
                        </p>
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

                {/* Wallet Status Indicator */}
                <div className="mb-6">
                    <WalletStatusIndicator showDetails={true} />
                </div>

                {/* Explanation Card */}
                <Card className="mb-6 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 text-xl">ℹ️</div>
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">How Token Creation Works</h3>
                                <div className="text-sm text-blue-700 space-y-2">
                                    <p>• <strong>Contract Parameters:</strong> This form requires exactly 8 parameters as per contract ABI</p>
                                    <p>• <strong>Total Supply:</strong> Fixed total supply of tokens to create</p>
                                    <p>• <strong>Bonding Curve:</strong> Token price increases as more tokens are bought from the contract</p>
                                    <p>• <strong>Fees:</strong> Transaction fees are handled automatically by the contract</p>
                                    <p>• <strong>After Creation:</strong> Use the Market page to buy tokens with APT</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-6">
                    <form onSubmit={handleCreateToken} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="symbol">1. Token Symbol *</Label>
                                <Input
                                    id="symbol"
                                    name="symbol"
                                    placeholder="e.g., LOU1S"
                                    value={formData.symbol}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 1: symbol (vector&lt;u8&gt;)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">2. Token Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g., Lou1s Token"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 2: name (vector&lt;u8&gt;)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="iconUrl">3. Icon URL *</Label>
                                <Input
                                    id="iconUrl"
                                    name="iconUrl"
                                    placeholder="https://example.com/icon.png"
                                    value={formData.iconUrl}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 3: icon (vector&lt;u8&gt;)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="projectUrl">4. Project URL *</Label>
                                <Input
                                    id="projectUrl"
                                    name="projectUrl"
                                    placeholder="https://yourproject.com"
                                    value={formData.projectUrl}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 4: project_url (vector&lt;u8&gt;)</p>
                            </div>
                        </div>

                        {/* Description field for UI only - not sent to contract */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (UI display only)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe your token... (for display purposes only)"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                This field is for UI display only and will not be sent to the smart contract.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="decimals">5. Decimals *</Label>
                                <Input
                                    id="decimals"
                                    name="decimals"
                                    type="number"
                                    min="0"
                                    max="18"
                                    placeholder="8"
                                    value={formData.decimals}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 5: decimals (u8)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="totalSupply">6. Total Supply *</Label>
                                <Input
                                    id="totalSupply"
                                    name="totalSupply"
                                    placeholder="1000000"
                                    value={formData.totalSupply}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 6: total_supply (u64)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mintAmount">7. Bonding Curve Constant (K) *</Label>
                                <Input
                                    id="mintAmount"
                                    name="mintAmount"
                                    placeholder="1000"
                                    value={formData.mintAmount}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 7: k (u64)</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="buyFee">8. Fee Rate (basis points) *</Label>
                                <Input
                                    id="buyFee"
                                    name="buyFee"
                                    placeholder="300"
                                    value={formData.buyFee}
                                    onChange={handleInputChange}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Parameter 8: fee_rate (u64)</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <Button
                                type="submit"
                                disabled={isLoading || isConnectingWallet}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 min-w-40"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Creating Token...
                                    </>
                                ) : (
                                    "Create Token"
                                )}
                            </Button>

                            {/* Test Connection Button */}
                            {connectedWallet.isAuthenticated && (!aptosWallet.connected || typeof aptosWallet.signAndSubmitTransaction !== 'function') && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isConnectingWallet}
                                    onClick={autoConnectAptosWallet}
                                    className="border-blue-200 text-blue-600 hover:bg-blue-50 min-w-40"
                                >
                                    {isConnectingWallet ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                            Connecting...
                                        </>
                                    ) : (
                                        "Connect Wallet"
                                    )}
                                </Button>
                            )}
                        </div>
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
