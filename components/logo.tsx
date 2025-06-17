"use client";

import { cn } from "@/lib/utils";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Logo({ isScrolled }: { isScrolled?: boolean }) {
  return (
    <div className="text-3xl font-semibold flex items-center">
      <div
        className={cn(
          "w-12 h-12 overflow-hidden flex items-center justify-center",
          isScrolled && "bg-[#0B0E14] rounded-xl"
        )}
      >
        <DotLottieReact
          className={cn("size-30", isScrolled && "bg-[#0B0E14] ")}
          src="https://lottie.host/463110b9-19f2-473d-80c4-0b3b0f80907e/UFFVpGgnre.lottie"
          loop
          autoplay
        />
      </div>
      <span className={cn("text-primary pb-2", isScrolled && "hidden")}>
        crion
      </span>
    </div>
  );
}
