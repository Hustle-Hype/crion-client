import Footer from "@/components/layouts/footers";
import { HomeHeader } from "@/components/layouts/headers/home-headers";

export default function Home() {
  return (
    <>
      <HomeHeader />
      <div className="h-[100rem] bg-background">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-4xl font-bold">
            Welcome to the future of marketing
          </h1>
        </div>
      </div>
      <Footer />
    </>
  );
}
