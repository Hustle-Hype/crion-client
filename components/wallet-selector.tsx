"use client";

import React, { useState, useRef, useEffect } from "react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
// Setup Aptos SDK for balance fetch
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/hyper-text";
import { useWallet } from "@/hooks/wallet/useWallet";
import {
  PetraIcon,
  MartianIcon,
  PontemIcon,
} from "@/components/icons/wallet-icons";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface Wallet {
  name: string;
  icon: React.ReactNode;
  installed: boolean;
}

export function WalletSelector() {
  const {
    connect,
    disconnect,
    connected,
    connecting,
    account,
    handleWalletLogin,
    authenticated,
    userData,
    getAvatarUrl,
    logout,
  } = useWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [aptBalance, setAptBalance] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch APT balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (account?.address) {
        try {
          const res = await aptos.getAccountAPTAmount({
            accountAddress: account.address,
          });
          // Chia cho 1e8 để chuyển từ octas sang APT
          const apt = Number(res) / 1e8;
          setAptBalance(
            apt.toLocaleString(undefined, { maximumFractionDigits: 4 }) + " APT"
          );
        } catch {
          setAptBalance("");
        }
      } else {
        setAptBalance("");
      }
    };
    fetchBalance();
  }, [account?.address]);

  // Wallet list with better icons and more options
  // Wallets giống hình
  // Aptos wallets only
  const wallets = [
    {
      name: "Petra",
      icon: (
        <img src="/wallet-icons/petra.svg" alt="Petra" className="w-8 h-8" />
      ),
      status: "INSTALLED",
      installed: typeof window !== "undefined" && !!(window as any).aptos,
    },
    {
      name: "Martian",
      icon: (
        <img
          src="/wallet-icons/martian.svg"
          alt="Martian"
          className="w-8 h-8"
        />
      ),
      status: "INSTALLED",
      installed: false,
    },
    {
      name: "Pontem",
      icon: (
        <img src="/wallet-icons/pontem.svg" alt="Pontem" className="w-8 h-8" />
      ),
      status: "INSTALLED",
      installed: false,
    },
    {
      name: "Fewcha",
      icon: (
        <img src="/wallet-icons/fewcha.svg" alt="Fewcha" className="w-8 h-8" />
      ),
      status: "INSTALLED",
      installed: false,
    },
    {
      name: "Spika",
      icon: (
        <img src="/wallet-icons/spika.svg" alt="Spika" className="w-8 h-8" />
      ),
      status: "INSTALLED",
      installed: false,
    },
    {
      name: "Rise",
      icon: <img src="/wallet-icons/rise.svg" alt="Rise" className="w-8 h-8" />,
      status: "INSTALLED",
      installed: false,
    },
    {
      name: "All Wallets",
      icon: (
        <img
          src="/wallet-icons/allwallets.svg"
          alt="All Wallets"
          className="w-8 h-8"
        />
      ),
      status: "7",
      installed: false,
    },
  ];

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    router.push("/profile");
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const connectToPetra = async () => {
    await connect();
    setIsModalOpen(false);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  // If authenticated, show user dropdown
  if (authenticated && userData && account) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm hover:bg-white/10 transition-all duration-200 min-w-0"
        >
          <img
            src={getAvatarUrl(account.address)}
            alt="Avatar"
            className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex-shrink-0"
          />
          <div className="min-w-0 hidden sm:flex sm:flex-col">
            <div className="text-xs lg:text-sm font-medium text-white truncate flex items-center gap-2">
              {`${account.address.slice(0, 4)}...${account.address.slice(-3)}`}
              {aptBalance && (
                <span className="text-[#ABF2FF] font-semibold ml-2">
                  {aptBalance}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 truncate">
              Score: {userData.score?.totalScore || 0} | Staked:{" "}
              {userData.stakedAmount}
            </div>
          </div>
          <svg
            className={`w-3 h-3 lg:w-4 lg:h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-56 lg:w-64 bg-[#0B0E14] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden backdrop-blur-sm transform origin-top-right"
            style={{
              background:
                "linear-gradient(135deg, rgba(11, 14, 20, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(171, 242, 255, 0.2)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              animation: "fadeInScale 0.2s ease-out",
            }}
          >
            {/* User Info Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={getAvatarUrl(account.address)}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">
                    {userData.username || `User ${account.address.slice(0, 6)}`}
                  </div>
                  <div className="text-xs text-gray-400">
                    {`${account.address.slice(0, 8)}...${account.address.slice(
                      -6
                    )}`}
                  </div>
                  {aptBalance && (
                    <div className="text-xs text-[#ABF2FF] font-semibold mt-1">
                      {aptBalance}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={handleProfileClick}
                className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-200 flex items-center gap-3"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                View Profile
              </button>

              <div className="border-t border-white/10 my-1"></div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 flex items-center gap-3"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If connected but not authenticated, show connecting status or disconnect option
  if (connected && account && !authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
        </div>
        {connecting ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Signing in...</span>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handleDisconnect}
            className="text-sm"
          >
            Disconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Button
        variant="crion"
        onClick={() => setIsModalOpen(true)}
        disabled={connecting}
        className="flex items-center gap-2 text-sm font-medium uppercase"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>Connect Wallet</span>
      </Button>

      {/* Modal nhỏ gọn, chỉ ví Aptos */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-colors duration-200"
          style={{ background: 'rgba(11, 14, 20, 0.92)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative bg-[#181A20] rounded-[32px] w-[360px] mx-4 shadow-2xl p-0 border border-[#23262F] z-[100000]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#23262F]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#23262F] text-white">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#ABF2FF"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      stroke="#ABF2FF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16v-4M12 8h.01"
                    />
                  </svg>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white text-center flex-1 -ml-7">
                Connect Wallet
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Wallet List */}
            <div className="py-2 px-2">
              {wallets.map((wallet, idx) => (
                <button
                  key={wallet.name}
                  disabled={!wallet.installed && wallet.name !== "All Wallets"}
                  onClick={
                    wallet.name === "Petra" && wallet.installed
                      ? connectToPetra
                      : undefined
                  }
                  className={`w-full flex items-center justify-between px-3 py-2 bg-[#181A20] hover:bg-[#23262F] transition rounded-2xl mb-2 ${!wallet.installed && wallet.name !== "All Wallets"
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#23262F]">
                      {wallet.icon}
                    </div>
                    <span className="text-white font-medium text-[15px]">
                      {wallet.name}
                    </span>
                  </div>
                  <div>
                    {wallet.status === "INSTALLED" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#219653] text-xs text-white font-semibold">
                        INSTALLED
                      </span>
                    )}
                    {wallet.name === "All Wallets" && (
                      <span className="px-2 py-0.5 rounded-full bg-[#23262F] text-xs text-gray-300 font-semibold">
                        {wallet.status}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
