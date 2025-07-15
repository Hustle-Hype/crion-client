import React from "react";
import { ThemeProvider } from "./theme-provider";
import { WalletProvider } from "./wallet-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <WalletProvider>
        {children}
      </WalletProvider>
    </ThemeProvider>
  );
}
