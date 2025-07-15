"use client";

import { useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";
import { useWallet as useCustomWallet } from "./useWallet";
import { useSafeWallet } from "./useSafeWallet";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "../use-toast";

export function useUnifiedWallet() {
  const aptosWallet = useAptosWallet();
  const safeWallet = useSafeWallet();
  const customWallet = useCustomWallet();
  const { isAuthenticated, user } = useAuth();

  // Unified connect function that connects both wallets
  const connectUnified = async (walletName?: string) => {
    try {
      console.log("Starting unified wallet connection...", { walletName });

      // Step 1: Connect Aptos wallet adapter first using safe connect
      if (walletName && !aptosWallet.connected) {
        console.log("Connecting Aptos wallet adapter safely...");
        await safeWallet.safeConnect(walletName);

        console.log("Aptos wallet adapter connected:", {
          connected: aptosWallet.connected,
          account: aptosWallet.account?.address,
        });
      }

      // Step 2: Check if we need to authenticate
      if (!isAuthenticated) {
        console.log("User not authenticated, attempting wallet login...");

        if (aptosWallet.account) {
          // We have Aptos wallet connected, now authenticate with backend
          console.log("Attempting backend authentication...");
          await customWallet.handleWalletLogin();

          console.log("Backend authentication completed");
        } else {
          console.log("No Aptos account found, connecting custom wallet...");
          // Connect custom wallet and authenticate
          await customWallet.connect();
          await customWallet.handleWalletLogin();
        }
      } else {
        console.log("User already authenticated");
      }

      // Verify final state
      const finalState = {
        aptosConnected: aptosWallet.connected,
        authenticated: isAuthenticated,
        hasAccount: !!aptosWallet.account,
      };
      console.log("Final connection state:", finalState);

      toast({
        title: "Wallet Connected Successfully!",
        description: "Both Aptos wallet and authentication are now connected.",
      });
    } catch (error: any) {
      console.error("Unified connect failed:", error);
      toast({
        title: "Connection Failed",
        description:
          error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Unified disconnect function
  const disconnectUnified = async () => {
    try {
      // Disconnect both systems
      if (aptosWallet.connected) {
        await aptosWallet.disconnect();
      }
      if (customWallet.connected) {
        await customWallet.disconnect();
      }

      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from all wallets.",
      });
    } catch (error: any) {
      console.error("Unified disconnect failed:", error);
    }
  };

  // Check if both systems are connected
  const isFullyConnected = aptosWallet.connected && isAuthenticated;
  const canSignTransactions =
    aptosWallet.connected &&
    aptosWallet.account &&
    aptosWallet.signAndSubmitTransaction;

  return {
    // Aptos wallet adapter properties
    aptosWallet,

    // Custom wallet properties
    customWallet,

    // Unified properties
    isFullyConnected,
    canSignTransactions,
    isAuthenticated,
    user,
    account: aptosWallet.account || customWallet.account,

    // Unified functions
    connectUnified,
    disconnectUnified,

    // Status info
    status: {
      aptosConnected: aptosWallet.connected,
      authConnected: isAuthenticated,
      readyForTransactions: canSignTransactions,
    },
  };
}
