"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetLandingDataQuery } from "@/features/landingApi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LandingContainer } from "./LandingContainer";

const NAV_LINKS = [
  { href: "#industries", label: "Industries" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#platform", label: "Platform" },
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#pricing", label: "Pricing" },
];

export const Navigation = () => {
  const { data, isLoading } = useGetLandingDataQuery();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const navBg =
    isScrolled || isMenuOpen
      ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-200/80 dark:border-gray-800/80 shadow-sm"
      : "bg-white/60 dark:bg-gray-950/60 backdrop-blur-md md:bg-transparent md:dark:bg-transparent";

  if (isLoading) {
    return (
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <LandingContainer className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-28 rounded bg-muted animate-pulse" />
          </div>
          <div className="hidden md:flex gap-3">
            <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
          </div>
        </LandingContainer>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
      ? "bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-lg"
      : "bg-transparent"
      }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          {data?.toolLogo ? (
            <img
              src={`${API_URL}${data.toolLogo}`}
              alt="Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0"
            />
          ) : (
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          )}
          <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {data?.toolName || "SmartPOS"}
          </span>
        </a>

        <div className="hidden lg:flex gap-5 xl:gap-7 items-center">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              {label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}

          <div className="flex gap-2.5 ml-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 text-white"
              onClick={() => router.push("/sign-up")}
            >
              Register
            </Button>
          </div>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-muted/80 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </LandingContainer>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {["features", "industries", "pricing"].map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 py-2 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                onClick={() => {
                  router.push("/login");
                  setIsMenuOpen(false);
                }}
              >
                Sign In
              </Button>
              <Button
                className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white"
                onClick={() => {
                  router.push("/sign-up");
                  setIsMenuOpen(false);
                }}
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
