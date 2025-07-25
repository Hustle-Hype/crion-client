import type { Metadata } from "next";
import { Funnel_Display } from "next/font/google";
import "@/styles/globals.css";
import Providers from "@/components/providers";
import MobileSupportSoon from "@/components/temp/mobile-support-soon";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import PageLayout from "@/components/layouts/page-layout";

const fontSans = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crion | RWA Launchpad",
  description: "RWA Launchpad on Aptos Blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="hidden lg:block">
            <Providers>
              <PageLayout>{children}</PageLayout>
            </Providers>
          </div>
          <div className="block lg:hidden">
            <MobileSupportSoon />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
