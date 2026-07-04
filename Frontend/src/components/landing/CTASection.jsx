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
    <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-purple-500/10 to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 landing-grid-pattern opacity-20 pointer-events-none" />

      <LandingContainer className="relative">
        <motion.div
          className="w-full text-center rounded-2xl sm:rounded-3xl border border-primary/20 bg-card/70 backdrop-blur-md p-8 sm:p-12 lg:p-14 shadow-2xl shadow-primary/10"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-5 sm:mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            14-day free trial · No credit card
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 tracking-tight leading-tight">
            Your Industry.{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              One SaaS Platform.
            </span>
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
