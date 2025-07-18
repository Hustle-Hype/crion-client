import React from "react";

import Hero from "./hero";
import Spline from "@splinetool/react-spline/next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useConnectedWallet } from "@/hooks/wallet/useConnectedWallet";
import { toast } from "@/hooks/use-toast";
import RippleGrid from "./ripple-grid";

export default function HeroSection() {
  const connectedWallet = useConnectedWallet();
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!connectedWallet.connected) {
      e.preventDefault();
      toast({
        title: "Please log in",
        description: "You must connect your wallet to tokenize your assets.",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-[#0B0E14] overflow-hidden px-4 sm:px-6 lg:px-8 text-center">
      {/* Grid background */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <RippleGrid gridColor="#ABF2FF" gridSize={10} gridThickness={15} opacity={0.5} />
      </div>

      <div className="absolute h-[414px] w-full top-[-100px] z-10">
        <div className="transform-gpu absolute h-[90px] w-full left-1/2 -translate-x-1/2 blur-[50px] [border-radius:50%_100%] bg-[#ABF2FF] mix-blend-plus-lighter" />
      </div>

      <div className="transform-gpu hero-eclipse h-[2500px] w-screen left-1/2 -top-[1500px] -translate-x-1/2 absolute mix-blend-color-dodge z-10" />

      {/* <Hero /> */}

      <div className="relative flex flex-col items-center justify-center gap-4 mt-10 z-20">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold pointer-events-none">
          <span className="text-primary">Crion: Launch like</span>
          <br />
          <span className="text-primary">it&apos;s 2030</span>
        </h1>
        <p className="text-base sm:text-lg font-bold pointer-events-none">
          Smart scores. Clean UI.
        </p>
        <Button variant="crion" className="w-fit" asChild>
          <Link href="/token/create" onClick={handleClick}>
            Tokenize Your Assets
          </Link>
        </Button>
      </div>
    </div>
  );
}
