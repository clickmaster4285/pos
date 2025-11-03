"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetLandingDataQuery } from "@/features/landingApi";

export const Navigation = () => {
  const { data, isLoading, error } = useGetLandingDataQuery();
  const router = useRouter();

  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3455").replace(/\/$/, "");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong</p>;

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          {data?.toolLogo ? (
            <img
              src={`${API_URL}${data.toolLogo}`}
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
          ) : (
            <ShoppingCart className="h-8 w-8 text-primary" />
          )}
          <span className="text-2xl font-bold">{data?.toolName}</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-6 items-center">
          <a
            href="#features"
            className="text-foreground/70 hover:text-foreground transition-colors hover:scale-105 duration-200"
          >
            Features
          </a>
          <a
            href="#industries"
            className="text-foreground/70 hover:text-foreground transition-colors hover:scale-105 duration-200"
          >
            Industries
          </a>
          <a
            href="#pricing"
            className="text-foreground/70 hover:text-foreground transition-colors hover:scale-105 duration-200"
          >
            Pricing
          </a>

          {/* Auth Buttons */}
          <Button
            variant="outline"
            size="sm"
            className="hover:scale-105 transition-transform"
            onClick={() => router.push("/login")}
          >
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 hover:scale-105 transition-transform"
            onClick={() => router.push("/sign-up")}
          >
            Register
          </Button>
        </div>
      </div>
    </nav>
  );
};
