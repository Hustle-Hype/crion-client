import React from "react";
import Hero from "./hero";
import Spline from "@splinetool/react-spline/next";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-[#000000] overflow-hidden px-4 sm:px-6 lg:px-8">
      <div className="absolute h-[414px] w-full top-[-100px]">
        <div className="transform-gpu absolute h-[90px] w-full left-1/2 -translate-x-1/2 blur-[50px] [border-radius:50%_100%] bg-[#ABF2FF] mix-blend-plus-lighter" />
      </div>
      <div className="transform-gpu hero-eclipse h-[2500px] w-screen left-1/2 -top-[1500px] -translate-x-1/2 absolute mix-blend-color-dodge"></div>
      <Hero />
      <div className="relative items-center justify-center lg:items-start  mx-auto mt-10 lg:mt-0 lg:absolute lg:top-60 lg:left-50 flex flex-col gap-2 px-4 sm:px-6 lg:px-0">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold z-50 pointer-events-none text-center lg:text-left">
          <span className="text-primary">Crion: Launch like</span>
          <br />
          <span className="text-primary">it&apos;s 2030</span>
        </h1>
        <p className="text-base sm:text-lg font-bold z-50 pointer-events-none text-center lg:text-left">
          Smart scores. Clean UI. Zero BS.
        </p>
        <Button variant="crion" className="w-fit">
          <Link href="/">Tokenize Your Assets</Link>
        </Button>
      </div>
      {/* <Spline
        className="absolute z-10 w-full h-full top-16 lg:inset-10 lg:top-14 lg:left-100 opacity-50 lg:opacity-100 hidden lg:block"
        scene="https://prod.spline.design/GEgZWYXC0EjvS3Vs/scene.splinecode"
      /> */}
    </div>
  );
}
