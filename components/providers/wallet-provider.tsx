"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

interface WalletProviderProps {
    children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    return (
        <>
            {children}
            <Toaster position="top-center" />
        </>
    );
}
