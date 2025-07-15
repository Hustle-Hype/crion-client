'use client';
import HeroSection from "@/containers/marketing/landing/hero-section";


import BuyTokenSection from "@/components/token/buy-token-section";

import { useState } from "react";
import MostIgnitedSection from "@/components/token/most-ignited-section";



export default function Home() {
  const [tokens, setTokens] = useState<any[]>([]);
  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <MostIgnitedSection tokens={tokens} />
      <BuyTokenSection tokens={tokens} setTokens={setTokens} />
    </div>
  );
}
