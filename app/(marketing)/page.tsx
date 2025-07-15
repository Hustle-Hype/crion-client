import HeroSection from "@/containers/marketing/landing/hero-section";

import BuyTokenSection from "@/components/token/buy-token-section";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <BuyTokenSection />
    </div>
  );
}
