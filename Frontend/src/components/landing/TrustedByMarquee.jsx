"use client";

import { TRUSTED_BRANDS } from "@/constants/landingContent";
import { LandingContainer } from "./LandingContainer";

export const TrustedByMarquee = () => {
  const brands = [...TRUSTED_BRANDS, ...TRUSTED_BRANDS];

  return (
    <section className="py-8 sm:py-10 border-y border-border/40 bg-muted/20 overflow-hidden">
      <LandingContainer>
        <p className="text-center text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">
          Multi-industry SaaS · Integrates with your stack
        </p>
      </LandingContainer>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap">
          {brands.map((brand, i) => (
            <span
              key={`${brand}-${i}`}
              className="mx-6 sm:mx-10 text-lg sm:text-xl font-bold text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors select-none"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
