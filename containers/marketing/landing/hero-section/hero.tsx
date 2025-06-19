import { GridPattern } from "@/components/backgrounds/grid-pattern";
import { cn } from "@/lib/utils";
import Spline from "@splinetool/react-spline/next";

export default function Hero() {
  return (
    <>
      <GridPattern
        width={100}
        height={100}
        x={-1}
        y={-1}
        className={cn(
          "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] lg:[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
        )}
      />
    </>
  );
}
