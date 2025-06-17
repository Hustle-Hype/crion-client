import React from "react";

export default function HeroSection() {
  return (
    <div className="absolute w-screen h-screen bg-[#0B0E14] overflow-hidden">
      <div className="absolute h-[414px] w-full top-[-100px]">
        <div className="transform-gpu absolute h-[90px] w-full left-1/2 -translate-x-1/2 blur-[50px] [border-radius:50%_100%] bg-[#ABF2FF] mix-blend-plus-lighter" />
      </div>
      <div className="transform-gpu hero-eclipse h-[2500px] w-screen left-1/2 -top-[1500px] -translate-x-1/2 absolute mix-blend-color-dodge"></div>
    </div>
  );
}
