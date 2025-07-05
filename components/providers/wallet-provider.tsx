"use client";

import React from "react";
import { Toaster } from "@/components/ui/toaster";

interface WalletProviderProps {
    children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    return (
        <>
            {children}
            <Toaster />
        </>
    );
}
