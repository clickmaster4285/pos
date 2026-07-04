"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { TESTIMONIALS } from "@/constants/landingContent";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

export const TestimonialsSection = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = TESTIMONIALS[active];

  const go = (dir) => {
    setActive((prev) =>
      dir === "next"
        ? (prev + 1) % TESTIMONIALS.length
        : (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length
    );
  };

  return (
    <section id="testimonials" className="py-16 sm:py-20 lg:py-24 scroll-mt-20 bg-gradient-to-b from-primary/5 to-transparent">
      <LandingContainer>
        <SectionHeader
          badge="Customer Stories"
          title="Trusted Across Every Industry"
          description="See how SaaS teams in retail, dining, pharmacy, and electronics scale with SmartPOS."
        />

        <div className="w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="relative rounded-2xl sm:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm p-6 sm:p-10 lg:p-12 shadow-xl"
            >
              <Quote className="absolute top-6 right-6 sm:top-8 sm:right-8 h-10 w-10 sm:h-12 sm:w-12 text-primary/10" />

              <div className="flex gap-1 mb-5 sm:mb-6">
                {Array.from({ length: current.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="text-base sm:text-lg lg:text-xl leading-relaxed text-foreground mb-8 sm:mb-10 pr-4">
                &ldquo;{current.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${current.color} flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shrink-0`}
                >
                  {current.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.role}</p>
                  {current.industry && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                      {current.industry}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              onClick={() => go("prev")}
              className="p-2.5 rounded-full border border-border/60 bg-background hover:bg-muted hover:border-primary/40 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => go("next")}
              className="p-2.5 rounded-full border border-border/60 bg-background hover:bg-muted hover:border-primary/40 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-10 sm:mt-14 w-full">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setActive(i)}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all duration-300 ${
                i === active
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border/60 bg-card/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                >
                  {t.avatar}
                </div>
                <span className="text-xs sm:text-sm font-medium truncate">{t.name.split(" ")[0]}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{t.role}</p>
            </button>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
};
