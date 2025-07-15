"use client";

import { useState, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { useSafeWallet } from "@/hooks/wallet/useSafeWallet";

// Contract constants
const CONTRACT_ADDRESS = "0x7d263f6b2532fbde3fde3a11ce687eb0288fcbf09387ed1b6eeb81b01d86c0eb";
const MODULE_NAME = "fa_factory";

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

export default function TradePage() {
    const { toast } = useToast();
    const connectedWallet = useConnectedWallet();
    const { safeSignAndSubmitTransaction } = useSafeWallet();

    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [mintingToken, setMintingToken] = useState<string | null>(null);
    const [mintAmounts, setMintAmounts] = useState<{ [key: string]: string }>({});

    // Initialize Aptos client
    const aptosConfig = new AptosConfig({
        network: Network.TESTNET,
        clientConfig: {
            API_KEY: "AG-9W2L7VUVYZ8VCUMYY8VMRVMICKYNYC68H"
        }
    });
    const aptos = new Aptos(aptosConfig);

    // Load tokens on component mount
    useEffect(() => {
        loadTokens();
    }, []);

    // Debug wallet state
    useEffect(() => {
        console.log("Wallet state:", {
            connected: connectedWallet.connected,
            account: connectedWallet.account?.address,
            isAuthenticated: connectedWallet.isAuthenticated,
            user: connectedWallet.user
        });
    }, [connectedWallet]);

    const loadTokens = async () => {
        try {
            setLoading(true);

            // Get all TokenCreated events from the contract
            const events = await aptos.getModuleEventsByEventType({
                eventType: `${CONTRACT_ADDRESS}::${MODULE_NAME}::TokenCreated`,
                minimumLedgerVersion: 0,
            });

            console.log("Token events:", events);

            const tokenInfos: TokenInfo[] = [];

            for (const event of events) {
                try {
                    const eventData = event.data as any;

                    // Validate required fields
                    if (!eventData.symbol || !eventData.name || !eventData.token_address) {
                        console.warn("Skipping incomplete token event:", eventData);
                        continue;
                    }

                    const tokenInfo: TokenInfo = {
                        symbol: eventData.symbol || "UNKNOWN",
                        name: eventData.name || "Unknown Token",
                        description: eventData.description || "No description available",
                        decimals: parseInt(eventData.decimals) || 6,
                        iconUrl: eventData.icon_url || "",
                        projectUrl: eventData.project_url || "",
                        totalSupply: eventData.total_supply || "0",
                        maxSupply: eventData.max_supply || "0",
                        buyFee: parseInt(eventData.buy_fee) || 0,
                        creator: eventData.creator || "",
                        tokenAddress: eventData.token_address,
                    };
                    tokenInfos.push(tokenInfo);
                } catch (err) {
                    console.error("Error parsing token event:", err);
                }
            }

            setTokens(tokenInfos);
            console.log("Loaded tokens:", tokenInfos);
        } catch (error) {
            console.error("Error loading tokens:", error);
            toast({
                title: "Error",
                description: "Failed to load tokens. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMintTokens = async (tokenSymbol: string, tokenAddress: string, isCreator: boolean = false) => {
        if (!connectedWallet.connected || !connectedWallet.account) {
            toast({
                title: "Wallet not connected",
                description: "Please connect your wallet to mint tokens.",
                variant: "destructive",
            });
            return;
        }

        const amount = mintAmounts[tokenSymbol];
        if (!amount || parseFloat(amount) <= 0) {
            toast({
                title: "Invalid amount",
                description: "Please enter a valid amount to mint.",
                variant: "destructive",
            });
            return;
        }

        try {
            setMintingToken(tokenSymbol);

            // Find token info to get decimals
            const tokenInfo = tokens.find(t => t.symbol === tokenSymbol);
            if (!tokenInfo) {
                throw new Error("Token not found");
            }

            // Convert amount to proper decimals
            const amountWithDecimals = Math.floor(parseFloat(amount) * Math.pow(10, tokenInfo.decimals));

            let payload;
            let actionType;

            // Check if current user is the creator
            const userAddress = connectedWallet.account.address.toString();
            const isTokenCreator = tokenInfo.creator.toLowerCase() === userAddress.toLowerCase();

            if (isTokenCreator) {
                // Creator can mint tokens directly without paying fees
                payload = {
                    type: "entry_function_payload",
                    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::mint`,
                    type_arguments: [],
                    arguments: [tokenAddress, amountWithDecimals.toString()],
                };
                actionType = "Mint";
            } else {
                // Non-creators must buy tokens (includes fees)
                // Convert symbol to vector<u8> to match contract ABI
                const symbolBytes = Array.from(new TextEncoder().encode(tokenSymbol));

                payload = {
                    type: "entry_function_payload",
                    function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::buy_tokens`,
                    type_arguments: [],
                    arguments: [symbolBytes, amountWithDecimals.toString()],
                };
                actionType = "Buy";
            }

            console.log(`${actionType} tokens with payload:`, payload);

            const response = await safeSignAndSubmitTransaction(payload as any);
            console.log("Transaction response:", response);

            // Wait for transaction confirmation
            await aptos.waitForTransaction({
                transactionHash: response.hash,
            });

            toast({
                title: `Tokens ${actionType === "Mint" ? "Minted" : "Purchased"}!`,
                description: (
                    <div className="space-y-2">
                        <p>Successfully {actionType === "Mint" ? "minted" : "purchased"} {amount} {tokenSymbol} tokens!</p>
                        {actionType === "Buy" && (
                            <p className="text-xs text-muted-foreground">
                                Fee included: {(tokenInfo.buyFee / 100)}%
                            </p>
                        )}
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

            // Clear the mint amount for this token
            setMintAmounts(prev => ({ ...prev, [tokenSymbol]: "" }));

        } catch (error: any) {
            console.error("Error processing tokens:", error);
            toast({
                title: "Transaction Failed",
                description: error.message || "Failed to process tokens. Please try again.",
                variant: "destructive",
            });
        } finally {
            setMintingToken(null);
        }
    };

    const handleAmountChange = (tokenSymbol: string, amount: string) => {
        setMintAmounts(prev => ({ ...prev, [tokenSymbol]: amount }));
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

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Token Marketplace</h1>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">Loading tokens...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Token Marketplace</h1>
                    <p className="text-muted-foreground">
                        Browse and mint tokens created on the platform
                    </p>
                </div>

                {!connectedWallet.connected || !connectedWallet.account ? (
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                                <p className="text-muted-foreground">
                                    Please connect your wallet to mint tokens.
                                </p>
                                {!connectedWallet.connected && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Status: Wallet not connected
                                    </p>
                                )}
                                {connectedWallet.connected && !connectedWallet.account && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Status: No account found
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2 text-green-600">Wallet Connected</h3>
                                <p className="text-muted-foreground">
                                    Connected to: {connectedWallet.account?.address?.toString().slice(0, 6)}...{connectedWallet.account?.address?.toString().slice(-4)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {tokens.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
                                <p className="text-muted-foreground mb-4">
                                    There are no tokens available for trading yet.
                                </p>
                                <Button onClick={loadTokens}>Refresh</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tokens.map((token, index) => (
                            <Card key={`${token.tokenAddress}-${index}`} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start gap-3">
                                        {token.iconUrl && (
                                            <img
                                                src={token.iconUrl}
                                                alt={token.name}
                                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{token.name}</CardTitle>
                                            <CardDescription className="font-mono text-sm">
                                                ${token.symbol}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {token.description}
                                        </p>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-muted-foreground">Total Supply:</span>
                                                <p className="font-mono">
                                                    {formatNumber(token.totalSupply, token.decimals)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Max Supply:</span>
                                                <p className="font-mono">
                                                    {formatNumber(token.maxSupply, token.decimals)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Buy Fee:</span>
                                                <p className="font-mono">
                                                    {isNaN(token.buyFee) ? "0" : (token.buyFee / 100)}%
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Decimals:</span>
                                                <p className="font-mono">{token.decimals}</p>
                                            </div>
                                        </div>

                                        {token.projectUrl && (
                                            <a
                                                href={token.projectUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline block truncate"
                                            >
                                                Project Website →
                                            </a>
                                        )}
                                    </div>
                                </CardContent>

                                <div className="px-6 pb-6">
                                    <div className="space-y-3">
                                        {/* Show creator info */}
                                        <div className="text-xs text-muted-foreground">
                                            <p>Creator: {token.creator.slice(0, 6)}...{token.creator.slice(-4)}</p>
                                            {connectedWallet.account &&
                                                token.creator.toLowerCase() === connectedWallet.account.address.toString().toLowerCase() && (
                                                    <p className="text-green-600 font-medium">
                                                        ✓ You are the creator - mint without fees
                                                    </p>
                                                )}
                                        </div>

                                        <div>
                                            <Label htmlFor={`amount-${token.symbol}`} className="text-sm">
                                                {connectedWallet.account &&
                                                    token.creator.toLowerCase() === connectedWallet.account.address.toString().toLowerCase()
                                                    ? "Amount to Mint (Free)"
                                                    : `Amount to Buy (${(token.buyFee / 100)}% fee)`}
                                            </Label>
                                            <Input
                                                id={`amount-${token.symbol}`}
                                                type="number"
                                                step="0.000001"
                                                min="0"
                                                placeholder="0.0"
                                                value={mintAmounts[token.symbol] || ""}
                                                onChange={(e) => handleAmountChange(token.symbol, e.target.value)}
                                                disabled={!connectedWallet.connected || !connectedWallet.account || mintingToken === token.symbol}
                                            />
                                        </div>

                                        <Button
                                            onClick={() => handleMintTokens(token.symbol, token.tokenAddress)}
                                            disabled={
                                                !connectedWallet.connected ||
                                                !connectedWallet.account ||
                                                mintingToken === token.symbol ||
                                                !mintAmounts[token.symbol] ||
                                                parseFloat(mintAmounts[token.symbol] || "0") <= 0
                                            }
                                            className="w-full"
                                        >
                                            {mintingToken === token.symbol ? (
                                                "Processing..."
                                            ) : !connectedWallet.connected || !connectedWallet.account ? (
                                                "Connect Wallet"
                                            ) : connectedWallet.account &&
                                                token.creator.toLowerCase() === connectedWallet.account.address.toString().toLowerCase() ? (
                                                `Mint ${token.symbol} (Free)`
                                            ) : (
                                                `Buy ${token.symbol} (${(token.buyFee / 100)}% fee)`
                                            )}
                                        </Button>

                                        {/* Token address for reference */}
                                        <div className="text-xs text-muted-foreground">
                                            <p className="truncate">Token: {token.tokenAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={loadTokens}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Refresh Tokens"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
