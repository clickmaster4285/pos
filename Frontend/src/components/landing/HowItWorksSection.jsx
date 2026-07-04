"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS } from "@/constants/landingContent";
import {
  CreditCard,
  Layers,
  UserPlus,
  Rocket,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

const ICONS = {
  "credit-card": CreditCard,
  layers: Layers,
  "user-plus": UserPlus,
  rocket: Rocket,
};

function StepCard({ item, index, total }) {
  const Icon = ICONS[item.icon];
  const isLast = index === total - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative flex flex-col h-full group"
    >
      {/* Connector line — desktop */}
      {!isLast && (
        <div
          className="hidden lg:block absolute top-[2.75rem] left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 z-0"
          aria-hidden
        >
          <div className="h-full w-full bg-gradient-to-r from-primary/40 via-primary/20 to-primary/10 rounded-full" />
          <motion.div
            className={`h-full bg-gradient-to-r ${item.accent} rounded-full origin-left`}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
            viewport={{ once: true }}
            style={{ width: "100%", marginTop: "-2px", height: "2px" }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full rounded-2xl sm:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        {/* Gradient top bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${item.accent}`} />

        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* Step node */}
          <div className="flex items-center justify-between mb-5">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-2xl blur-md opacity-50 bg-gradient-to-br ${item.accent}`}
              />
              <div
                className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg`}
              >
                <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] sm:text-xs font-bold text-primary/70 tracking-[0.2em]">
                STEP
              </span>
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-none">
                {item.step.replace(/^0/, "")}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold mb-3 ${item.accentBg} text-foreground border border-border/40`}
          >
            {item.tag}
          </span>

          <h3 className="font-bold text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">
            {item.description}
          </p>
        </div>
      </div>

      {/* Mobile vertical connector */}
      {!isLast && (
        <div className="lg:hidden flex justify-center py-3" aria-hidden>
          <div className="w-0.5 h-6 bg-gradient-to-b from-primary/40 to-primary/10 rounded-full" />
        </div>
      )}
    </motion.div>
  );
}

export const HowItWorksSection = () => {
  const router = useRouter();

  return (
    <section id="quick-start" className="relative py-16 sm:py-20 lg:py-28 scroll-mt-20 overflow-hidden">
      <div className="absolute inset-0 landing-dot-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[80px] pointer-events-none" />

      <LandingContainer className="relative">
        <SectionHeader
          badge="Quick Overview"
          title="Four Steps to Get Started"
          description="From plan selection to your first sale — a clear path designed for every industry vertical."
        />

        {/* Steps grid / timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-5 xl:gap-6 w-full mb-10 sm:mb-14">
          {HOW_IT_WORKS.map((item, index) => (
            <StepCard
              key={item.step}
              item={item}
              index={index}
              total={HOW_IT_WORKS.length}
            />
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/90 to-purple-500/10 backdrop-blur-sm w-full"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
            <div className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-primary/15 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm sm:text-base">
                Ready to begin? Start with Step 1.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Or explore the full registration & operations guide below.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              size="lg"
              className="h-11 shadow-md group w-full sm:w-auto"
              onClick={() => router.push("/sign-up")}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 w-full sm:w-auto border-2 bg-background/60 group"
              onClick={() =>
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Full Guide
            </Button>
          </div>
        </motion.div>
      </LandingContainer>
    </section>
  );
};
