"use client";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Suppress wallet adapter errors in development
  const handleWalletError = (error: any) => {
    console.error("Wallet adapter error:", error);

    // Filter out specific errors that are known to be non-critical
    const nonCriticalErrors = [
      "'in' operator",
      "Cannot use 'in' operator to search for 'function' in undefined",
      "function",
      "undefined",
      "readyState",
    ];

    const isNonCritical = nonCriticalErrors.some(
      (pattern) =>
        error?.message?.includes(pattern) ||
        error?.toString()?.includes(pattern)
    );

    if (isNonCritical) {
      console.warn(
        "Non-critical wallet adapter error filtered:",
        error?.message || error
      );
      return;
    }

    // Log critical errors but don't show toast to avoid spamming user
    console.error("Critical wallet adapter error:", error);
  };

  return (
    <AptosWalletAdapterProvider
      // autoConnect={true}
      dappConfig={{
        network: Network.TESTNET,
      }}
      onError={handleWalletError}
    >
      {children}
      <Toaster />
    </AptosWalletAdapterProvider>
  );
}
