// components/landing/Navigation.jsx
"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetLandingDataQuery } from "@/features/landingApi";
import { useState, useEffect } from "react";

export const Navigation = () => {
  const { data, isLoading, error } = useGetLandingDataQuery();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

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
              className="h-10 w-10 object-contain transition-transform hover:scale-110 duration-300"
            />
          ) : (
            <ShoppingCart className="h-10 w-10 text-blue-600 dark:text-blue-400 transition-transform hover:scale-110 duration-300" />
          )}
          <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {data?.toolName || "SmartPOS"}
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          {["features", "industries", "pricing"].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 font-medium relative group"
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-all duration-300 border-gray-300 hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300"
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-700 dark:text-gray-300"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

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