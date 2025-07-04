"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "../use-toast";

export const API_URL_AUTH = `${process.env.NEXT_PUBLIC_API_URL}/auth`;

interface WalletAccount {
  address: string;
  publicKey: string;
}

interface UserData {
  id: string;
  address: string;
  bio: string;
  avatar: string;
  stakedAmount: number;
  score: number;
  website: string;
  walletLinks: Array<{
    network: string;
    address: string;
  }>;
  socialLinks: Array<any>;
}

interface UseWalletReturn {
  account: WalletAccount | null;
  connected: boolean;
  connecting: boolean;
  authenticated: boolean;
  userData: UserData | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: {
    message: string;
    nonce: string;
  }) => Promise<{ signature: string }>;
  handleWalletLogin: () => Promise<void>;
  getAvatarUrl: (address: string) => string;
}

export function useWallet(): UseWalletReturn {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
    checkAuthState();
  }, []);

  const checkAuthState = () => {
    const accessToken = localStorage.getItem("accessToken");
    const storedUserData = localStorage.getItem("userData");

    if (accessToken && storedUserData) {
      setAuthenticated(true);
      setUserData(JSON.parse(storedUserData));
    }
  };

  const getAvatarUrl = (address: string) => {
    // Generate random avatar using icebear with wallet address as seed
    const seed = address.slice(-8); // Use last 8 characters as seed
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  const checkConnection = async () => {
    if (typeof window === "undefined") return;

    try {
      const aptosWallet = (window as any).aptos;
      if (aptosWallet) {
        const response = await aptosWallet.account();
        if (response) {
          setAccount({
            address: response.address,
            publicKey: response.publicKey,
          });
          setConnected(true);
        }
      }
    } catch (error) {
      console.log("No wallet connected");
    }
  };

  const connect = useCallback(async () => {
    if (typeof window === "undefined") return;

    setConnecting(true);
    try {
      const aptosWallet = (window as any).aptos;
      if (!aptosWallet) {
        toast({
          variant: "destructive",
          title: "Wallet not found",
          description:
            "Petra wallet is not installed. Redirecting to Chrome Web Store...",
        });
        window.open(
          "https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci",
          "_blank"
        );
        return;
      }

      const response = await aptosWallet.connect();
      setAccount({
        address: response.address,
        publicKey: response.publicKey,
      });
      setConnected(true);
      toast({
        variant: "success",
        title: "Wallet connected",
        description: "Successfully connected to Petra wallet!",
      });
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
      });
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const aptosWallet = (window as any).aptos;
      if (aptosWallet) {
        await aptosWallet.disconnect();
      }
      setAccount(null);
      setConnected(false);
      setAuthenticated(false);
      setUserData(null);

      // Clear stored auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");

      toast({
        title: "Wallet disconnected",
        description: "Successfully disconnected from wallet.",
      });
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, []);

  const signMessage = useCallback(
    async (messageData: { message: string; nonce: string }) => {
      if (typeof window === "undefined" || !connected) {
        throw new Error("Wallet not connected");
      }

      const aptosWallet = (window as any).aptos;
      if (!aptosWallet) {
        throw new Error("Petra wallet not found");
      }

      try {
        const response = await aptosWallet.signMessage(messageData);
        console.log("Raw signature from wallet:", response.signature); // Debug log

        // Backend expects signature in the format: { data: { data: byteArray } }
        // The signature from wallet might be hex string or already in correct format
        let signature;

        if (typeof response.signature === "string") {
          // If signature is hex string, convert to byte array format expected by backend
          const hexString = response.signature.replace("0x", "");
          const byteArray: { [key: number]: number } = {};
          for (let i = 0; i < hexString.length; i += 2) {
            byteArray[i / 2] = parseInt(hexString.substr(i, 2), 16);
          }
          signature = { data: { data: byteArray } };
        } else {
          // If signature is already in object format, use as is
          signature = response.signature;
        }

        console.log("Formatted signature:", signature); // Debug log
        return { signature };
      } catch (error) {
        console.error("Failed to sign message:", error);
        throw error;
      }
    },
    [connected]
  );

  const handleWalletLogin = useCallback(async () => {
    if (!connected || !account?.address || !account?.publicKey) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your wallet first before logging in.",
      });
      return;
    }

    setConnecting(true);
    try {
      const walletAddress = account.address;
      const publicKey = account.publicKey;

      // 1. Get nonce from server
      const nonceResponse = await axios.get(`${API_URL_AUTH}/nonce`, {
        params: { wallet_address: walletAddress },
      });

      console.log("Nonce response:", nonceResponse.data); // Debug log

      // Parse the response - the message field contains a JSON string
      const { nonce, message: messageString } = nonceResponse.data.data;

      // The message field is a JSON string that needs to be parsed
      const messageObj = JSON.parse(messageString);

      console.log("Parsed message object:", messageObj); // Debug log

      // 2. Sign message with wallet - sign the JSON string
      const signedMessage = await signMessage({
        message: messageString, // Use the JSON string as the message to sign
        nonce: nonce,
      });

      // Some backends might need the full message that was signed
      const fullMessage = `${messageString}\nnonce: ${nonce}`;

      // Construct the login payload
      const loginPayload = {
        address: walletAddress,
        publicKey: publicKey,
        signature: signedMessage.signature,
        message: messageString, // Use the JSON string as message
        nonce: nonce, // Add nonce field explicitly
        fullMessage: fullMessage, // Add full message if needed
      };

      console.log("Login payload:", loginPayload); // Debug logging

      // 3. Send login request with signature
      const loginResponse = await axios.post(
        `${API_URL_AUTH}/wallet-login`,
        loginPayload
      );

      const { accessToken, refreshToken, user } = loginResponse.data.data;

      // Save tokens and user data
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userData", JSON.stringify(user));

      // Update state
      setAuthenticated(true);
      setUserData(user);

      toast({
        variant: "success",
        title: "Login successful",
        description: `Welcome back! Connected to ${user.address.slice(
          0,
          6
        )}...${user.address.slice(-4)}`,
      });
      // Note: Router navigation would be handled by the component using this hook
    } catch (error: any) {
      console.error("Wallet login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to login with wallet";
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
    } finally {
      setConnecting(false);
    }
  }, [connected, account, signMessage]);

  return {
    account,
    connected,
    connecting,
    authenticated,
    userData,
    connect,
    disconnect,
    signMessage,
    handleWalletLogin,
    getAvatarUrl,
  };
}
