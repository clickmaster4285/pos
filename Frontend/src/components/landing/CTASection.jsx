"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Utensils, Shirt, Pill, Laptop, Store } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { INDUSTRY_CONFIG } from "@/constants/landingContent";
import { LandingContainer } from "./LandingContainer";

const ICONS = {
  Restaurant: Utensils,
  Fashion: Shirt,
  Pharmacy: Pill,
  Electronics: Laptop,
  "General Shop": Store,
};

export const CTASection = () => {
  const router = useRouter();
  const industries = Object.keys(INDUSTRY_CONFIG);

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-accent opacity-10"></div>
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-7 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
            Join 10,000+ businesses running on SmartPOS. Pick your vertical, start your trial, and
            go live today.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8 sm:mb-10">
            {industries.map((name) => {
              const Icon = ICONS[name];
              const cfg = INDUSTRY_CONFIG[name];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() =>
                    router.push(`/sign-up?step=2&industry=${encodeURIComponent(name)}`)
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium border border-border/60 bg-background/60 hover:border-primary/40 hover:shadow-md transition-all ${cfg.accentBg}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} />
                  {name}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              size="lg"
              className="h-12 sm:h-12 text-base shadow-xl shadow-primary/25 group w-full sm:w-auto px-8"
              onClick={() => router.push("/sign-up")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 sm:h-12 text-base border-2 bg-background/50 w-full sm:w-auto"
              onClick={() => router.push("/login")}
            >
              Sign In to Dashboard
            </Button>
          </div>
        </motion.div>
      </LandingContainer>
    </section>
  );
};
