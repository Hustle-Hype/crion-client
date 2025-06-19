import React from "react";
import Spline from "@splinetool/react-spline/next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "../logo";

export default function MobileSupportSoon() {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#0B0E14] overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="absolute h-[414px] w-full top-[-100px]">
        <div className="transform-gpu absolute h-[90px] w-full left-1/2 -translate-x-1/2 blur-[50px] [border-radius:50%_100%] bg-[#ABF2FF] mix-blend-plus-lighter" />
      </div>
      <div className="transform-gpu hero-eclipse h-[2500px] w-screen left-1/2 -top-[1500px] -translate-x-1/2 absolute mix-blend-color-dodge"></div>
      <div className="relative items-center justify-center lg:items-start  mx-auto mt-10 lg:mt-0 lg:absolute lg:top-60 lg:left-50 flex flex-col gap-2 px-4 sm:px-6 lg:px-0">
        <Logo />
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold z-50 pointer-events-none text-center lg:text-left">
          <span className="text-primary">Mobile Support Soon</span>
        </h1>
        <p className="text-base sm:text-lg font-bold z-50 pointer-events-none text-center lg:text-left">
          We&apos;re working on mobile support for Crion.
        </p>
        <Link href="/">
          <Button variant="crion" className="w-fit">
            Coming Soon
          </Button>
        </Link>
      </div>
    </div>
  );
}
