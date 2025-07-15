"use client";

/*
 * CRITICAL FIX: buy_tokens function expects symbol as vector<u8> (byte array), not string
 * Updated payload construction to encode token symbols as bytes using TextEncoder
 * This matches the contract ABI requirements: buy_tokens(symbol: vector<u8>, amount: u64)
 * Also applied to trade/page.tsx and token/create/page.tsx for consistency
 */

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TokenAddressDisplay } from "@/components/ui/token-address-display";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";
import Breadcrumb from "@/components/ui/breadcrumb";

const CONTRACT_ADDRESS = "0x7d263f6b2532fbde3fde3a11ce687eb0288fcbf09387ed1b6eeb81b01d86c0eb";
const MODULE_NAME = "fa_factory";

// Initialize Aptos client outside component to avoid re-creation
const aptosConfig = new AptosConfig({
    network: Network.TESTNET,
    clientConfig: {
        API_KEY: "AG-9W2L7VUVYZ8VCUMYY8VMRVMICKYNYC68H"
    }
});
const aptos = new Aptos(aptosConfig);

// Helper function to decode hex string to text
const decodeHexString = (hexString: string): string => {
    try {
        if (!hexString || !hexString.startsWith('0x')) {
            return hexString;
        }

        const hex = hexString.slice(2); // Remove '0x' prefix
        let result = '';

        for (let i = 0; i < hex.length; i += 2) {
            const byte = parseInt(hex.substr(i, 2), 16);
            if (byte > 0) { // Only add non-null bytes
                result += String.fromCharCode(byte);
            }
        }

        return result;
    } catch (error) {
        console.error("Error decoding hex string:", hexString, error);
        return hexString; // Return original if decode fails
    }
};

interface TokenInfo {
    symbol: string;
    name: string;
    description: string;
    decimals: number;
    iconUrl: string;
    projectUrl: string;
    totalSupply: string;
    maxSupply: string;
    buyFee: number;
    creator: string;
    tokenAddress: string;
}

export default function TokenMarketplacePage() {
    const connectedWallet = useConnectedWallet();
    const { safeSignAndSubmitTransaction } = useSafeWallet();
    const [allTokens, setAllTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [buyingToken, setBuyingToken] = useState<string | null>(null);
    const [buyAmounts, setBuyAmounts] = useState<{ [key: string]: string }>({});
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [tokenHealthStatus, setTokenHealthStatus] = useState<{ [key: string]: boolean }>({});

    const loadAllTokens = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // Add longer delay to prevent API rate limiting
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log("Fetching token events...");

            // Get all TokenCreated events from the contract
            const events = await aptos.getModuleEventsByEventType({
                eventType: `${CONTRACT_ADDRESS}::${MODULE_NAME}::TokenCreated`,
                minimumLedgerVersion: 0,
            });

            console.log("All token events:", events);
            console.log("Number of events:", events.length);

            if (events.length === 0) {
                console.warn("No token creation events found");
                setAllTokens([]);
                return;
            }

            const tokens: TokenInfo[] = [];

            for (let i = 0; i < events.length; i++) {
                const event = events[i];
                try {
                    const eventData = event.data as any;

                    console.log(`Processing event ${i}:`, event);
                    console.log("Event data:", eventData);

                    // Lấy creator address từ nhiều nguồn
                    let creatorAddress = eventData.creator;

                    // Nếu event có transaction_version và creator chưa có hoặc là 0x0000
                    if (event.transaction_version && (!creatorAddress || creatorAddress.includes('0000'))) {
                        try {
                            const txnDetails = await aptos.getTransactionByVersion({
                                ledgerVersion: event.transaction_version
                            });

                            if (txnDetails && 'sender' in txnDetails) {
                                creatorAddress = txnDetails.sender;
                                console.log(`Got creator from transaction: ${creatorAddress}`);
                            }
                        } catch (txnError) {
                            console.error("Error getting transaction details:", txnError);
                        }
                    }

                    // Nếu vẫn không có creator address hợp lệ, skip event này
                    if (!creatorAddress || creatorAddress.includes('0000')) {
                        console.warn("Skipping event without valid creator address");
                        continue;
                    }

                    // Decode hex fields from event data
                    const decodedSymbol = decodeHexString(eventData.symbol);
                    const decodedName = decodeHexString(eventData.name) || decodedSymbol || "Unknown Token";
                    const decodedDescription = decodeHexString(eventData.description) || "No description available";
                    const decodedIconUrl = decodeHexString(eventData.icon_url) || "";
                    const decodedProjectUrl = decodeHexString(eventData.project_url) || "";

                    console.log("Decoded fields:", {
                        symbol: decodedSymbol,
                        name: decodedName,
                        description: decodedDescription,
                        originalSymbol: eventData.symbol
                    });

                    const tokenInfo: TokenInfo = {
                        symbol: decodedSymbol || "UNKNOWN",
                        name: decodedName,
                        description: decodedDescription,
                        decimals: parseInt(eventData.decimals) || 6,
                        iconUrl: decodedIconUrl,
                        projectUrl: decodedProjectUrl,
                        totalSupply: eventData.total_supply || "0",
                        maxSupply: eventData.max_supply || eventData.total_supply || "0",
                        buyFee: parseInt(eventData.buy_fee || eventData.k) || 0, // k might be the fee
                        creator: creatorAddress,
                        tokenAddress: eventData.token_address || "",
                    };

                    // Chỉ thêm token nếu có đủ thông tin cần thiết
                    if (decodedSymbol && decodedSymbol !== "UNKNOWN" && creatorAddress) {
                        tokens.push(tokenInfo);
                        console.log(`Added token: ${tokenInfo.name} (${tokenInfo.symbol}) by ${tokenInfo.creator.slice(0, 8)}...`);
                    } else {
                        console.warn("Skipping token due to missing required fields:", {
                            symbol: decodedSymbol,
                            creator: creatorAddress,
                            tokenAddress: eventData.token_address
                        });
                    }
                } catch (err) {
                    console.error("Error parsing token event:", err, event);
                }
            }

            // Sort tokens by name
            tokens.sort((a, b) => a.name.localeCompare(b.name));
            setAllTokens(tokens);
            console.log("Final tokens list:", tokens);

            // Check token health status (but don't block the UI)
            if (tokens.length > 0) {
                checkAllTokensHealth(tokens);
            }
        } catch (error: any) {
            console.error("Error loading tokens:", error);

            // Handle rate limiting specifically
            if (error.message?.includes('429') || error.status === 429) {
                toast({
                    title: "Rate Limited",
                    description: "Too many requests. Please wait a moment and try again.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to load tokens. Please try again.",
                    variant: "destructive",
                });
            }
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadAllTokens();
    }, [loadAllTokens]);

    // Function to check all tokens health in background
    const checkAllTokensHealth = async (tokens: TokenInfo[]) => {
        try {
            const healthStatuses: { [key: string]: boolean } = {};

            // Check health for a few tokens at a time to avoid rate limiting
            for (let i = 0; i < Math.min(tokens.length, 5); i++) {
                const token = tokens[i];
                try {
                    const isHealthy = await checkTokenHealth(token.symbol);
                    healthStatuses[token.symbol] = isHealthy;

                    if (!isHealthy) {
                        console.warn(`Token ${token.symbol} appears to be corrupted`);
                    }

                    // Small delay between checks
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Error checking health for ${token.symbol}:`, error);
                    healthStatuses[token.symbol] = true; // Assume healthy on error
                }
            }

            setTokenHealthStatus(healthStatuses);
        } catch (error) {
            console.error("Error checking token health:", error);
        }
    };

    // Function to check if token is healthy (metadata accessible)
    const checkTokenHealth = async (tokenSymbol: string): Promise<boolean> => {
        try {
            const tokenSymbolBytes = Array.from(new TextEncoder().encode(tokenSymbol));

            await aptos.view({
                payload: {
                    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_metadata`,
                    functionArguments: [tokenSymbolBytes]
                }
            });

            return true;
        } catch (error) {
            return false;
        }
    };

    // Function to create VIP test token
    const createVIPTestToken = async () => {
        try {
            const payload = {
                type: "entry_function_payload",
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_token`,
                type_arguments: [],
                arguments: [
                    "VIP",                  // string: symbol
                    "VIP Token",           // string: name  
                    "",                    // string: icon
                    "",                    // string: project_url
                    8,                     // u8: decimals
                    "1000000",             // u64: total_supply (toàn bộ supply)
                    "500",                 // u64: k (bonding curve constant)
                    "300",                 // u64: fee_rate (fee percentage)
                ],
            };

            console.log("Creating VIP test token with payload:", payload);
            const response = await safeSignAndSubmitTransaction(payload);

            if (response?.hash) {
                toast({
                    title: "VIP Token Created!",
                    description: "VIP test token has been created successfully. You can now buy it.",
                });

                // Reload tokens after creation
                setTimeout(() => {
                    loadAllTokens(true);
                }, 2000);
            }
        } catch (error: any) {
            console.error("Error creating VIP token:", error);
            toast({
                title: "Creation Failed",
                description: error.message || "Failed to create VIP token",
                variant: "destructive",
            });
        }
    };

    // Function to verify if token exists in contract before purchase
    const verifyTokenExists = async (tokenSymbol: string): Promise<boolean> => {
        try {
            console.log(`🔍 Verifying if token "${tokenSymbol}" exists in contract...`);

            // Add delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 800));

            // Method 1: Check events to see if token was created
            const events = await aptos.getModuleEventsByEventType({
                eventType: `${CONTRACT_ADDRESS}::${MODULE_NAME}::TokenCreated`,
                minimumLedgerVersion: 0,
            });

            console.log(`Found ${events.length} token creation events`);

            let foundInEvents = false;
            for (const event of events) {
                const eventData = event.data as any;
                const decodedSymbol = decodeHexString(eventData.symbol);

                if (decodedSymbol === tokenSymbol) {
                    console.log(`✅ Token "${tokenSymbol}" found in contract events`);
                    foundInEvents = true;
                    break;
                }
            }

            if (!foundInEvents) {
                console.log(`❌ Token "${tokenSymbol}" not found in contract events`);
                return false;
            }

            // Method 2: Try to call get_metadata view function to verify token exists
            try {
                console.log(`Trying to call get_metadata view function for "${tokenSymbol}"`);

                const tokenSymbolBytes = Array.from(new TextEncoder().encode(tokenSymbol));

                // Call the get_metadata view function from the contract
                const metadataResult = await aptos.view({
                    payload: {
                        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_metadata`,
                        functionArguments: [tokenSymbolBytes]
                    }
                });

                if (metadataResult && metadataResult.length > 0) {
                    console.log(`✅ Token "${tokenSymbol}" metadata accessible via view function`);
                    return true;
                } else {
                    console.log(`❌ Token "${tokenSymbol}" metadata not accessible via view function`);
                    return false;
                }

            } catch (metadataError: any) {
                console.log(`❌ Token "${tokenSymbol}" view function error:`, metadataError.message);

                // If the view function fails with object not found, token doesn't exist properly
                if (metadataError.message?.includes("not found") ||
                    metadataError.message?.includes("does not exist") ||
                    metadataError.message?.includes("EOBJECT_DOES_NOT_EXIST") ||
                    metadataError.message?.includes("Move abort")) {
                    return false;
                }

                // For other errors, assume it exists to avoid blocking valid purchases
                return true;
            }

        } catch (error) {
            console.error("Error verifying token existence:", error);
            // If we can't verify due to rate limiting, assume it exists
            return true;
        }
    };

    const handleBuyTokens = async (tokenSymbol: string) => {
        if (!connectedWallet.connected || !connectedWallet.account) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to buy tokens.",
                variant: "destructive",
            });
            return;
        }

        const amount = buyAmounts[tokenSymbol];
        if (!amount || parseFloat(amount) <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid amount to buy.",
                variant: "destructive",
            });
            return;
        }

        try {
            setBuyingToken(tokenSymbol);

            // Find token info
            const tokenInfo = allTokens.find(t => t.symbol === tokenSymbol);
            if (!tokenInfo) {
                throw new Error("Token not found");
            }

            // Verify token exists in contract before attempting purchase
            const tokenExists = await verifyTokenExists(tokenSymbol);
            if (!tokenExists) {
                toast({
                    title: "Token Metadata Error",
                    description: (
                        <div className="space-y-2">
                            <p>Token "{tokenSymbol}" was found in creation events but its metadata object is not accessible.</p>
                            <p className="text-sm text-muted-foreground">
                                This usually means the token was created improperly or is corrupted.
                            </p>
                            <p className="text-sm text-yellow-600">
                                💡 Try creating the token again with the correct parameters.
                            </p>
                        </div>
                    ),
                    variant: "destructive",
                });
                return;
            }

            // Convert APT amount to proper decimals (APT has 8 decimals)
            // The amount user enters is in APT, we need to convert to octas (1 APT = 10^8 octas)
            const amountInOctas = Math.floor(parseFloat(amount) * Math.pow(10, 8));

            // Based on contract ABI: buy_tokens(symbol: vector<u8>, amount: u64)
            // The function expects: token_symbol (vector<u8>) and apt_amount (u64)

            // Convert symbol string to vector<u8> (byte array)
            const symbolBytes = Array.from(new TextEncoder().encode(tokenSymbol));

            const payload = {
                type: "entry_function_payload" as const,
                function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                type_arguments: [],
                arguments: [
                    symbolBytes,               // vector<u8>: token symbol as byte array
                    amountInOctas.toString()   // u64: amount in octas (APT base units)
                ],
            };

            console.log("Buying tokens with payload:", payload);
            console.log("Token symbol:", tokenSymbol);
            console.log("Token symbol as bytes:", symbolBytes);
            console.log("Token address:", tokenInfo.tokenAddress);
            console.log("Amount in APT:", amount);
            console.log("Amount in octas:", amountInOctas);
            console.log("Token info:", tokenInfo);
            console.log("📋 Contract ABI Compliance Check:");
            console.log("- arg0 (symbol): vector<u8> ✅", symbolBytes);
            console.log("- arg1 (amount): u64 ✅", amountInOctas.toString());

            console.log("Attempting to buy fungible asset tokens...");

            // Try to verify if the token exists in the contract before buying
            console.log("🔍 Verifying token existence before purchase...");

            let tokenExistsInContract = false;
            try {
                // Check if token exists by trying to get its metadata object
                // Based on the contract, tokens are stored as objects with symbol as key
                const tokenObjectQuery = await aptos.getAccountResources({
                    accountAddress: CONTRACT_ADDRESS
                });
                console.log("Contract resources found:", tokenObjectQuery.length);

                // Look for token-related resources
                const tokenResources = tokenObjectQuery.filter(resource =>
                    resource.type.includes('Token') ||
                    resource.type.includes('FA') ||
                    resource.type.includes('fungible') ||
                    resource.type.includes('Object')
                );
                console.log("Token-related resources:", tokenResources);

                // Try to check if there are any specific token objects
                const hasTokenObjects = tokenResources.some(resource =>
                    resource.data && typeof resource.data === 'object'
                );

                if (hasTokenObjects) {
                    tokenExistsInContract = true;
                    console.log("✅ Token objects found in contract");
                } else {
                    console.log("⚠️  No token objects found in contract resources");
                }

            } catch (verifyError) {
                console.warn("Could not verify contract state:", verifyError);
            }

            // Additional debug: Check if token exists in contract
            console.log("Debug info for contract call:");
            console.log("- Contract Address:", CONTRACT_ADDRESS);
            console.log("- Module Name:", MODULE_NAME);
            console.log("- Function:", `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`);
            console.log("- Token Symbol:", tokenSymbol);
            console.log("- Token Symbol Length:", tokenSymbol.length);
            console.log("- Token Symbol as bytes (vector<u8>):", symbolBytes);
            console.log("- Amount in octas:", amountInOctas);
            console.log("- Alternative: Try with token address instead?", tokenInfo.tokenAddress);

            // Suggestion for debugging
            console.log("💡 Contract Documentation Analysis:");
            console.log("1. Token must be created with 'create_token' function first");
            console.log("2. create_token args: symbol, name, icon_url, project_url, decimals, max_supply, total_supply, buy_fee");
            console.log("3. buy_tokens args: symbol (vector<u8>), amount (u64) ✅ - Updated to match contract ABI");
            console.log("4. Check if token was created by the same deployer");
            console.log("5. Token symbol is now encoded as byte array to match contract expectations");

            // Check if this token was created by current user or if it exists
            const isUserToken = tokenInfo.creator === connectedWallet.account?.address?.toString();

            if (!isUserToken) {
                console.log("⚠️  Token was not created by current user:");
                console.log("- Token creator:", tokenInfo.creator);
                console.log("- Current user:", connectedWallet.account?.address?.toString());
                console.log("- This may cause transaction to fail if token doesn't exist in contract");

                // Show additional warning for non-user tokens
                toast({
                    title: "Token Warning",
                    description: `This token was created by another user. If the purchase fails, the token may not exist in the contract yet.`,
                    variant: "default",
                });
            } else {
                console.log("✅ Token was created by current user - higher chance of success");
            }

            // Try the transaction with improved wallet adapter handling
            console.log("Attempting transaction with multiple fallback strategies...");

            let response;

            // Validate payload before sending
            if (!payload || typeof payload !== 'object' || !payload.function) {
                throw new Error("Invalid payload structure");
            }

            // Strategy 1: Try the recommended new format first { payload }
            if (connectedWallet.wallet && typeof (connectedWallet.wallet as any).signAndSubmitTransaction === 'function') {
                try {
                    console.log("Strategy 1: Using new format { payload }");

                    // Create a clean payload object to avoid 'in' operator issues
                    const cleanPayload = {
                        type: payload.type,
                        function: payload.function,
                        type_arguments: payload.type_arguments || [],
                        arguments: payload.arguments || []
                    };

                    response = await (connectedWallet.wallet as any).signAndSubmitTransaction({ payload: cleanPayload });
                    console.log("New format successful:", response);
                } catch (newFormatError: any) {
                    console.log("New format failed:", newFormatError.message);

                    // Strategy 2: Try old format (payload directly)
                    try {
                        console.log("Strategy 2: Using legacy format (payload)");

                        const cleanPayload = {
                            type: payload.type,
                            function: payload.function,
                            type_arguments: payload.type_arguments || [],
                            arguments: payload.arguments || []
                        };

                        response = await (connectedWallet.wallet as any).signAndSubmitTransaction(cleanPayload);
                        console.log("Legacy format successful:", response);
                    } catch (legacyError: any) {
                        console.log("Legacy format failed:", legacyError.message);

                        // Strategy 3: Final fallback to safe wallet
                        console.log("Strategy 3: Using safe wallet as final fallback");
                        response = await safeSignAndSubmitTransaction(payload);
                    }
                }
            } else {
                // No direct wallet available, use safe wallet
                console.log("No direct wallet available, using safe wallet");
                response = await safeSignAndSubmitTransaction(payload);
            }

            console.log("Buy response:", response);

            // Wait for transaction confirmation
            await aptos.waitForTransaction({
                transactionHash: response.hash,
            });

            toast({
                title: "Tokens Purchased Successfully!",
                description: (
                    <div className="space-y-2">
                        <p>Successfully purchased {tokenSymbol} tokens with {amount} APT!</p>
                        <a
                            href={`https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm"
                        >
                            View transaction on explorer →
                        </a>
                    </div>
                ),
            });

            // Clear the buy amount for this token
            setBuyAmounts(prev => ({ ...prev, [tokenSymbol]: "" }));

            // Reload tokens to get updated supply with longer delay to avoid rate limiting
            setTimeout(() => {
                loadAllTokens(true);
            }, 3000);

        } catch (error: any) {
            console.error("Error buying tokens:", error);

            let errorMessage = "Failed to purchase fungible asset tokens. Please try again.";
            let isComplexError = false;

            if (error.message?.includes("object does not exist")) {
                errorMessage = `Token "${tokenSymbol}" does not exist in the contract. This token needs to be created first using the 'create_token' function before it can be purchased.`;
                isComplexError = true;
            } else if (error.message?.includes("ETOKEN_NOT_FOUND") || error.message?.includes("TOKEN_NOT_FOUND")) {
                errorMessage = `Token "${tokenSymbol}" was not found in the contract. Please verify the token exists or create it first.`;
                isComplexError = true;
            } else if (error.message?.includes("insufficient")) {
                errorMessage = "Insufficient APT balance. Please check your wallet balance.";
            } else if (error.message?.includes("simulation failed")) {
                errorMessage = `Transaction simulation failed. The fungible asset "${tokenSymbol}" might not be properly configured for purchases.`;
            } else if (error.message?.includes("EOWNER_ONLY") || error.message?.includes("unauthorized")) {
                errorMessage = `Access denied. Only the token creator can perform this action for "${tokenSymbol}".`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            const tokenInfo = allTokens.find(t => t.symbol === tokenSymbol);

            toast({
                title: "Purchase Failed",
                description: (
                    <div className="space-y-2">
                        <p>{errorMessage}</p>
                        {isComplexError && (
                            <div className="text-xs bg-gray-100 p-2 rounded mt-2">
                                <p><strong>Required steps:</strong></p>
                                <p>1. Create token using <code>create_token</code> function</p>
                                <p>2. Then <code>buy_tokens</code> will work</p>
                                <p>3. Go to <strong>Create Token</strong> page first</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Debug info: Tried to buy "{tokenSymbol}" with {amount} APT
                        </p>
                    </div>
                ),
                variant: "destructive",
            });
        } finally {
            setBuyingToken(null);
        }
    };

    const handleAmountChange = (tokenSymbol: string, amount: string) => {
        setBuyAmounts(prev => ({ ...prev, [tokenSymbol]: amount }));
    };

    const formatNumber = (value: string, decimals: number) => {
        try {
            if (!value || value === "0" || value === "") {
                return "0";
            }
            const num = parseFloat(value) / Math.pow(10, decimals);
            if (isNaN(num)) {
                return "0";
            }
            return num.toLocaleString();
        } catch {
            return "0";
        }
    };

    const calculateUtilization = (totalSupply: string, maxSupply: string, decimals: number) => {
        try {
            const total = parseFloat(totalSupply) / Math.pow(10, decimals);
            const max = parseFloat(maxSupply) / Math.pow(10, decimals);
            if (max === 0) return 0;
            return (total / max) * 100;
        } catch {
            return 0;
        }
    };

    // Filter tokens based on search query
    const filteredTokens = allTokens.filter(token =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!connectedWallet.connected) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Token Marketplace</h1>
                    <Card className="p-8">
                        <p className="text-lg mb-4">Please connect your wallet to browse and buy tokens</p>
                        <p className="text-sm text-muted-foreground">
                            You need to connect your Aptos wallet to purchase tokens from the marketplace.
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
                    { label: "Marketplace", isCurrentPage: true }
                ]}
                className="mb-6"
            />

            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Token Marketplace</h1>
                    <p className="text-muted-foreground">
                        Discover and purchase tokens created by the community
                    </p>
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">
                            � <strong>How to buy:</strong> Enter the amount of APT you want to spend and click "Buy Token" to purchase tokens instantly.
                            Each token may have different buy fees set by the creator.
                        </p>
                    </div>
                </div>

                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-green-600">Wallet Connected</h3>
                                <p className="text-muted-foreground">
                                    Connected as: {connectedWallet.account?.address?.toString().slice(0, 6)}...{connectedWallet.account?.address?.toString().slice(-4)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Tokens Available</p>
                                <p className="text-2xl font-bold">{allTokens.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Important Notice */}
                <Card className="mb-6 border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="text-yellow-600 text-xl">⚠️</div>
                            <div>
                                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Tại sao token Lou1s mua được mà VIP không?</h3>
                                <div className="text-sm text-yellow-700 space-y-2">
                                    <p>• <strong>Token "Lou1s"</strong> đã được tạo trong contract nên có thể mua</p>
                                    <p>• <strong>Token "VIP"</strong> chưa được tạo trong contract nên không thể mua</p>
                                    <p>• Mỗi token phải được tạo bằng function <code>create_token</code> trước khi có thể mua</p>
                                    <p>• Sử dụng nút <strong>"Create VIP Test Token"</strong> để tạo token VIP test</p>
                                    <p>• Hoặc vào trang <strong>Create Token</strong> để tạo token mới</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Search Bar */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <Label htmlFor="search" className="text-sm font-medium">
                            Search Tokens
                        </Label>
                        <Input
                            id="search"
                            type="text"
                            placeholder="Search by name, symbol, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">Loading marketplace...</div>
                    </div>
                ) : filteredTokens.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">
                                    {searchQuery ? "No tokens found" : "No Tokens Available"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? `No tokens match your search "${searchQuery}"`
                                        : "No tokens have been created yet."
                                    }
                                </p>
                                <div className="space-x-2">
                                    {searchQuery && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            Clear Search
                                        </Button>
                                    )}
                                    <Button onClick={() => window.location.href = '/token/create'}>
                                        Create a Token
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={createVIPTestToken}
                                        disabled={loading}
                                    >
                                        Create VIP Test Token
                                    </Button>
                                    <Button variant="outline" onClick={() => loadAllTokens(true)} disabled={refreshing}>
                                        {refreshing ? "Refreshing..." : "Refresh"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {filteredTokens.map((token, index) => {
                            const utilization = calculateUtilization(token.totalSupply, token.maxSupply, token.decimals);
                            const isOwnToken = connectedWallet.account?.address?.toString().toLowerCase() === token.creator.toLowerCase();
                            const isHealthy = tokenHealthStatus[token.symbol] !== false; // undefined means not checked yet

                            return (
                                <Card key={`${token.tokenAddress}-${index}`} className={!isHealthy ? "border-red-200 bg-red-50" : ""}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                {token.iconUrl && (
                                                    <img
                                                        src={token.iconUrl}
                                                        alt={token.name}
                                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                )}
                                                <div>
                                                    <CardTitle className="text-xl">{token.name}</CardTitle>
                                                    <p className="text-lg font-mono text-muted-foreground">${token.symbol}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{token.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {isOwnToken && <Badge variant="secondary">Your Token</Badge>}
                                                {!isHealthy && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        ⚠️ Corrupted
                                                    </Badge>
                                                )}
                                                <Badge variant="outline">Buy Fee: {(token.buyFee / 100)}%</Badge>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Token Info */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold">Token Information</h4>

                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Total Supply:</span>
                                                        <p className="font-mono font-medium">
                                                            {formatNumber(token.totalSupply, token.decimals)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Max Supply:</span>
                                                        <p className="font-mono font-medium">
                                                            {formatNumber(token.maxSupply, token.decimals)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Utilization:</span>
                                                        <p className="font-mono font-medium">
                                                            {utilization.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Creator:</span>
                                                        <p className="font-mono font-medium text-xs">
                                                            {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Progress bar for utilization */}
                                                <div>
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                        <span>Supply Utilization</span>
                                                        <span>{utilization.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${Math.min(utilization, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <TokenAddressDisplay
                                                    address={token.tokenAddress}
                                                    label="Token Address"
                                                    showCopy={true}
                                                />
                                            </div>

                                            {/* Buy Section */}
                                            <div className="space-y-4">
                                                <h4 className="font-semibold">Purchase Tokens</h4>

                                                <div className="space-y-3">
                                                    <div>
                                                        <Label htmlFor={`buy-amount-${token.symbol}`} className="text-sm">
                                                            Amount to Spend (APT)
                                                        </Label>
                                                        <Input
                                                            id={`buy-amount-${token.symbol}`}
                                                            type="number"
                                                            step="0.00000001"
                                                            min="0"
                                                            placeholder="0.0"
                                                            value={buyAmounts[token.symbol] || ""}
                                                            onChange={(e) => handleAmountChange(token.symbol, e.target.value)}
                                                            disabled={buyingToken === token.symbol}
                                                        />
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            You will spend this amount of APT to buy <code className="bg-gray-100 px-1 rounded">{token.symbol}</code> tokens
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-1">
                                                            ✅ Using token symbol: "{token.symbol}" (as per contract requirement)
                                                        </p>
                                                        {!isHealthy && (
                                                            <p className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded border border-red-200">
                                                                ⚠️ <strong>Token Corrupted:</strong> This token's metadata is not accessible and purchases will likely fail.
                                                            </p>
                                                        )}
                                                        {isOwnToken ? (
                                                            <p className="text-xs text-green-600 mt-1 p-2 bg-green-50 rounded">
                                                                ✅ This is your token - it should be available for purchase
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-amber-600 mt-1 p-2 bg-amber-50 rounded">
                                                                ⚠️ Token created by another user - purchase may fail if not properly deployed
                                                            </p>
                                                        )}
                                                    </div>

                                                    <Button
                                                        onClick={() => handleBuyTokens(token.symbol)}
                                                        disabled={
                                                            buyingToken === token.symbol ||
                                                            !buyAmounts[token.symbol] ||
                                                            parseFloat(buyAmounts[token.symbol] || "0") <= 0 ||
                                                            !isHealthy
                                                        }
                                                        className="w-full"
                                                        size="lg"
                                                        variant={!isHealthy ? "destructive" : "default"}
                                                    >
                                                        {buyingToken === token.symbol
                                                            ? "Purchasing..."
                                                            : !isHealthy
                                                                ? "❌ Token Corrupted"
                                                                : `Buy ${token.symbol}`
                                                        }
                                                    </Button>

                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                window.open(
                                                                    `https://explorer.aptoslabs.com/account/${token.tokenAddress}?network=testnet`,
                                                                    "_blank"
                                                                );
                                                            }}
                                                        >
                                                            View on Explorer
                                                        </Button>
                                                        {token.projectUrl && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    window.open(token.projectUrl, "_blank");
                                                                }}
                                                            >
                                                                Project Website
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={() => loadAllTokens(true)}
                        disabled={refreshing || loading}
                    >
                        {refreshing ? "Refreshing..." : loading ? "Loading..." : "Refresh Marketplace"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
