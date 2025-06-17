import Footer from "@/components/layouts/footers";
import { HomeHeader } from "@/components/layouts/headers/home-headers";
import HeroSection from "@/containers/marketing/landing/hero-section";

export default function Home() {
  return (
    <>
      <HomeHeader />
      <div className="relative min-h-[100dvh]">
        <HeroSection />
      </div>
      <Footer />
    </>
  );
}
