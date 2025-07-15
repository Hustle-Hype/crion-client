"use client";

import { useWallet as useAptosWallet } from "@aptos-labs/wallet-adapter-react";
import { useConnectedWallet } from "./useConnectedWallet";
import { toast } from "../use-toast";

// Utility function to validate transaction payload
const validateTransactionPayload = (payload: any): string[] => {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    errors.push("Payload is undefined or not an object");
    return errors;
  }

  // Check required fields
  const requiredFields = ["type", "function", "arguments", "type_arguments"];
  for (const field of requiredFields) {
    if (!(field in payload)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate specific fields
  if (payload.type && payload.type !== "entry_function_payload") {
    errors.push(
      `Invalid type: ${payload.type}. Expected: entry_function_payload`
    );
  }

  if (payload.function && typeof payload.function !== "string") {
    errors.push(`Function must be a string, got: ${typeof payload.function}`);
  }

  if (payload.function && typeof payload.function === "string") {
    const parts = payload.function.split("::");
    if (parts.length !== 3) {
      errors.push(
        `Invalid function format: ${payload.function}. Expected: address::module::function`
      );
    }
  }

  if (payload.arguments && !Array.isArray(payload.arguments)) {
    errors.push(`Arguments must be an array, got: ${typeof payload.arguments}`);
  }

  if (payload.type_arguments && !Array.isArray(payload.type_arguments)) {
    errors.push(
      `Type arguments must be an array, got: ${typeof payload.type_arguments}`
    );
  }

  return errors;
};

export function useSafeWallet() {
  const aptosWallet = useAptosWallet();
  const connectedWallet = useConnectedWallet();

  // Fallback method using direct wallet interaction
  const fallbackSignAndSubmitTransaction = async (payload: any) => {
    console.log("Safe wallet: Attempting fallback transaction method...");

    try {
      // Try to use window.aptos directly as fallback
      if (typeof window !== "undefined" && (window as any).aptos) {
        const wallet = (window as any).aptos;
        console.log("Safe wallet: Using direct wallet API");

        // Check if wallet is connected
        const account = await wallet.account();
        if (!account) {
          throw new Error("Wallet not connected via direct API");
        }

        // Try new format first, then fallback to old format
        let result;
        try {
          console.log("Safe wallet: Trying new format { payload }");
          result = await wallet.signAndSubmitTransaction({ payload });
        } catch (newFormatError: any) {
          console.log("Safe wallet: New format failed, trying legacy format");
          result = await wallet.signAndSubmitTransaction(payload);
        }

        console.log("Safe wallet: Fallback transaction successful", result);
        return result;
      } else {
        throw new Error("Direct wallet API not available");
      }
    } catch (error: any) {
      console.error("Safe wallet: Fallback method also failed:", error);
      throw new Error(
        `Both primary and fallback methods failed: ${error.message}`
      );
    }
  };

  // Safe wrapper for signAndSubmitTransaction
  const safeSignAndSubmitTransaction = async (payload: any) => {
    try {
      // 🔍 PAYLOAD VALIDATION - Kiểm tra payload trước tiên
      console.log("Safe wallet: Validating payload...", payload);

      const validationErrors = validateTransactionPayload(payload);
      if (validationErrors.length > 0) {
        throw new Error(
          `Invalid transaction payload: ${validationErrors.join(", ")}`
        );
      }

      console.log("Safe wallet: Payload validation passed ✅");

      // Pre-checks for wallet state
      if (!connectedWallet.connected) {
        throw new Error("Wallet is not connected");
      }

      if (!connectedWallet.account) {
        throw new Error("No wallet account found");
      }

      // TỰ ĐỘNG KẾT NỐI APTOS WALLET NẾU CẦN
      if (
        connectedWallet.isAuthenticated &&
        (!aptosWallet.connected || !aptosWallet.signAndSubmitTransaction)
      ) {
        console.log(
          "Safe wallet: Auto-connecting Aptos wallet for transaction..."
        );

        try {
          const availableWallets = aptosWallet.wallets || [];
          const petraWallet = availableWallets.find(
            (w: any) => w.name === "Petra" && w.readyState === "Installed"
          );

          if (petraWallet && !aptosWallet.connected) {
            console.log("Safe wallet: Connecting to Petra wallet...");
            await aptosWallet.connect(petraWallet.name);

            // Đợi để đảm bảo kết nối hoàn thành
            await new Promise((resolve) => setTimeout(resolve, 1500));

            if (
              !aptosWallet.connected ||
              !aptosWallet.signAndSubmitTransaction
            ) {
              throw new Error("Failed to establish Aptos wallet connection");
            }

            console.log("Safe wallet: Aptos wallet connected successfully");

            toast({
              title: "Wallet connected",
              description:
                "Aptos wallet connected automatically for transaction.",
            });
          }
        } catch (connectError: any) {
          console.warn("Safe wallet: Auto-connect failed:", connectError);
          // Tiếp tục với fallback method
        }
      }

      // Check if we have a signing method (either direct wallet or authenticated user)
      const hasSigningMethod =
        aptosWallet.signAndSubmitTransaction || connectedWallet.isAuthenticated;

      if (!hasSigningMethod) {
        throw new Error("No transaction signing method available");
      }

      console.log("Safe wallet: Pre-transaction checks passed");

      // Wait a bit to ensure wallet is stable
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Attempt transaction with multiple retries
      let lastError;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `Safe wallet: Transaction attempt ${attempt}/${maxRetries}`
          );

          // Additional safety checks before each attempt
          if (!connectedWallet.connected || !connectedWallet.account) {
            throw new Error("Wallet disconnected during transaction");
          }

          let result;

          // Try direct Aptos wallet first if available
          if (
            aptosWallet.signAndSubmitTransaction &&
            typeof aptosWallet.signAndSubmitTransaction === "function"
          ) {
            console.log("Safe wallet: Using direct Aptos wallet method");
            const signFunction = aptosWallet.signAndSubmitTransaction;

            // Wrap in Promise.race with timeout to prevent hanging
            const timeoutMs = 30000; // 30 seconds timeout

            // Try new format first, then fallback to old format
            let transactionPromise;
            try {
              console.log(
                "Safe wallet: Calling signAndSubmitTransaction with new format { payload }..."
              );
              transactionPromise = (signFunction as any).call(aptosWallet, {
                payload,
              });
            } catch (newFormatError: any) {
              console.log(
                "Safe wallet: New format failed, trying legacy format"
              );
              transactionPromise = (signFunction as any).call(
                aptosWallet,
                payload
              );
            }

            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Transaction timeout")),
                timeoutMs
              );
            });

            result = await Promise.race([transactionPromise, timeoutPromise]);
          } else if (connectedWallet.isAuthenticated) {
            // Use fallback method for authenticated users
            console.log(
              "Safe wallet: Using fallback method for authenticated user"
            );
            result = await fallbackSignAndSubmitTransaction(payload);
          } else {
            throw new Error("No signing method available");
          }

          console.log("Safe wallet: Transaction successful", result);
          return result;
        } catch (error: any) {
          lastError = error;
          console.warn(
            `Safe wallet: Attempt ${attempt} failed:`,
            error.message || error
          );

          // Check for specific errors that suggest we should retry
          const retryableErrors = [
            "'in' operator",
            "function",
            "undefined",
            "not ready",
          ];

          const isRetryable = retryableErrors.some((pattern) =>
            error?.message?.includes(pattern)
          );

          if (!isRetryable || attempt === maxRetries) {
            throw error;
          }

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      throw lastError;
    } catch (error: any) {
      console.error("Safe wallet transaction failed:", error);

      // Enhanced error message handling
      const errorMessage =
        error?.message || error?.toString() || "Unknown error";

      // Handle specific wallet adapter errors with fallback attempt
      if (
        errorMessage.includes("'in' operator") ||
        errorMessage.includes(
          "Cannot use 'in' operator to search for 'function' in undefined"
        ) ||
        (errorMessage.includes("function") &&
          errorMessage.includes("undefined"))
      ) {
        console.error("Detected wallet adapter internal error:", errorMessage);
        console.log("Safe wallet: Attempting fallback method...");

        try {
          // Try fallback method once
          const fallbackResult = await fallbackSignAndSubmitTransaction(
            payload
          );
          console.log("Safe wallet: Fallback method succeeded!");
          return fallbackResult;
        } catch (fallbackError: any) {
          console.error(
            "Safe wallet: Fallback method also failed:",
            fallbackError
          );
          throw new Error(
            "Wallet adapter error detected and fallback failed. Please try: 1) Refresh the page, 2) Disconnect and reconnect wallet, 3) Clear browser cache if issue persists."
          );
        }
      }

      if (errorMessage.includes("Transaction timeout")) {
        throw new Error(
          "Transaction timed out. The network might be slow. Please try again."
        );
      }

      if (errorMessage.includes("Wallet disconnected")) {
        throw new Error(
          "Wallet was disconnected during transaction. Please reconnect and try again."
        );
      }

      if (error?.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected by user.");
      }

      if (error?.message?.includes("Insufficient")) {
        throw new Error("Insufficient funds for this transaction.");
      }

      // Default error
      throw new Error(
        error?.message || "Transaction failed. Please try again."
      );
    }
  };

  // Safe wrapper for connect
  const safeConnect = async (walletName: string) => {
    try {
      if (connectedWallet.connected) {
        console.log("Safe wallet: Already connected");
        return;
      }

      console.log("Safe wallet: Connecting to", walletName);
      await aptosWallet.connect(walletName);

      // Wait for connection to stabilize
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!aptosWallet.connected) {
        throw new Error("Connection failed");
      }

      console.log("Safe wallet: Connected successfully");
    } catch (error: any) {
      console.error("Safe wallet connect failed:", error);
      throw new Error(error?.message || "Failed to connect wallet");
    }
  };

  return {
    ...aptosWallet,
    safeSignAndSubmitTransaction,
    safeConnect,
  };
}
