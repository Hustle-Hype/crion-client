"use client";

import { useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";
import { useAuth } from "@/contexts/AuthContext";

export function useConnectedWallet() {
  const aptosWallet = useAptosWallet();
  const { isAuthenticated, user } = useAuth();

  // Return true if either the Aptos wallet is connected OR the user is authenticated
  const isConnected = aptosWallet.connected || isAuthenticated;

  return {
    ...aptosWallet,
    connected: isConnected,
    account:
      aptosWallet.account ||
      (user?.primaryWallet ? { address: user.primaryWallet } : null),
    isAuthenticated,
    user,
  };
}
