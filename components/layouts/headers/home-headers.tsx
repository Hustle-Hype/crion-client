"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { HyperText } from "@/components/hyper-text";

const menuItems = [
  { name: "Explore", href: "#link" },
  { name: "Ranking", href: "#link" },
];

export const HomeHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-2",
            isScrolled &&
              "bg-background-card-foreground/80 overflow-hidden backdrop-blur-lg max-w-4xl rounded-2xl border lg:px-2 gradient-border before:bg-border"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-2 lg:gap-0">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div
                className={cn(
                  "m-auto hidden size-fit lg:block",
                  isScrolled && "lg:hidden"
                )}
              >
                <ul className="flex gap-8 text-sm font-medium w-[180px]">
                  {menuItems.map((item, index) => (
                    <li key={index} className="w-[100%]">
                      <Link
                        href={item.href}
                        className="text-secondary transition duration-400 hover:text-primary font-mono uppercase "
                      >
                        <HyperText>{item.name}</HyperText>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <button className="w-[190px] lg:inline-flex group/button flex items-center cursor-pointer justify-center font-medium gap-x-2 flex-shrink-0 gradient-border px-4.5 py-3 text-[14px] rounded-xl text-sm leading-none transition before:[background:linear-gradient(180deg,_rgba(255,255,255,0.25)_0%,_rgba(255,255,255,0.15)_100%)] text-background [background:radial-gradient(161.28%_68.75%_at_50%_68.75%,_rgba(255,255,255,0)_0%,_rgba(255,255,255,0.5)_100%),_#00FFFF] shadow-[0px_0px_12px_rgba(145,255,255,0.24),inset_0px_-1px_0px_rgba(161,255,255,0.8),inset_0px_1px_4px_#6FFFFF] hover:shadow-[0px_0px_20px_rgba(145,255,255,0.24),inset_0px_-1px_0px_rgba(161,255,255,0.8),inset_0px_1px_4px_#6FFFFF]">
                  <Link
                    className="flex items-center gap-2 text-sm font-medium uppercase"
                    href="#"
                  >
                    <HyperText>Connect Wallet</HyperText>
                  </Link>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
