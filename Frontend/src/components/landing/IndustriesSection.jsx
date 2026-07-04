"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { INDUSTRY_CONFIG } from "@/constants/landingContent";
import { Industries } from "@/utils/industryFields";
import {
  Utensils,
  Shirt,
  Pill,
  Laptop,
  Store,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

const INDUSTRY_ICONS = {
  Restaurant: Utensils,
  Fashion: Shirt,
  Pharmacy: Pill,
  Electronics: Laptop,
  "General Shop": Store,
};

export const IndustriesSection = () => {
  const [active, setActive] = useState(Industries[0]);
  const router = useRouter();
  const config = INDUSTRY_CONFIG[active];
  const Icon = INDUSTRY_ICONS[active];

  const goToSignUp = () => {
    router.push(`/sign-up?step=2&industry=${encodeURIComponent(active)}`);
  };

  return (
    <section id="industries" className="py-16 sm:py-20 lg:py-24 scroll-mt-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent pointer-events-none" />

      <LandingContainer className="relative">
        <SectionHeader
          badge="Multi-Industry SaaS"
          title="Purpose-Built for Your Vertical"
          description="Select your industry at sign-up and get pre-configured workflows, fields, and reports — no custom development required."
        />

        {/* Industry selector — scroll on mobile */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap sm:justify-center mb-8 sm:mb-10 scrollbar-hide">
          {Industries.map((name) => {
            const cfg = INDUSTRY_CONFIG[name];
            const TabIcon = INDUSTRY_ICONS[name];
            const isActive = active === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setActive(name)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-all duration-300 border ${
                  isActive
                    ? `bg-gradient-to-r ${cfg.gradient} text-white border-transparent shadow-lg scale-[1.02]`
                    : "bg-card/80 border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                {name}
              </button>
            );
          })}
        </div>

        {/* Featured industry panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 rounded-2xl sm:rounded-3xl border border-border/60 overflow-hidden bg-card/50 backdrop-blur-sm shadow-2xl">
              {/* Left gradient panel */}
              <div
                className={`lg:col-span-2 relative p-6 sm:p-8 lg:p-10 bg-gradient-to-br ${config.gradient} text-white min-h-[280px] lg:min-h-0 flex flex-col justify-between`}
              >
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="inline-flex p-3 rounded-2xl bg-white/20 backdrop-blur-sm mb-5">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-2">{active}</h3>
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed">{config.tagline}</p>
                </div>

                <div className="relative mt-8 pt-6 border-t border-white/20">
                  <div className="text-4xl sm:text-5xl font-bold">{config.stat.value}</div>
                  <div className="text-sm text-white/80 mt-1">{config.stat.label}</div>
                </div>
              </div>

              {/* Right content */}
              <div className="lg:col-span-3 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    <Sparkles className="h-3 w-3" />
                    Industry Template Included
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8">
                    {config.description}
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">
                        Key Features
                      </h4>
                      <ul className="space-y-2.5">
                        {config.features.map((f) => (
                          <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <Check className={`h-4 w-4 shrink-0 ${config.accent}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">
                        SaaS Modules
                      </h4>
                      <ul className="space-y-2.5">
                        {config.modules.map((m) => (
                          <li key={m} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 bg-gradient-to-r ${config.gradient}`} />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className={`h-12 bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white border-0 shadow-lg w-full sm:w-auto group`}
                    onClick={goToSignUp}
                  >
                    Get Started for {active}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full sm:w-auto"
                    onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    View Plans
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Industry count banner */}
        <motion.div
          className="mt-10 sm:mt-14 flex flex-wrap justify-center gap-6 sm:gap-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {[
            { value: "5", label: "Industry Verticals" },
            { value: "50+", label: "Pre-built Modules" },
            { value: "1", label: "Unified Dashboard" },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-2xl sm:text-3xl font-bold text-primary">{item.value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </LandingContainer>
    </section>
  );
};
