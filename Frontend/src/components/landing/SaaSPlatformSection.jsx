"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { SAAS_PILLARS, PLATFORM_STATS, INDUSTRY_CONFIG } from "@/constants/landingContent";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Cloud,
  CreditCard,
  Building2,
  Shield,
  Zap,
  ArrowRight,
  Check,
  Utensils,
  Shirt,
  Pill,
  Laptop,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";

const ICONS = {
  layers: Layers,
  cloud: Cloud,
  "credit-card": CreditCard,
  building: Building2,
  shield: Shield,
  zap: Zap,
};

const INDUSTRY_ICONS = {
  Restaurant: Utensils,
  Fashion: Shirt,
  Pharmacy: Pill,
  Electronics: Laptop,
  "General Shop": Store,
};

function PlatformArchitecture() {
  const industries = Object.keys(INDUSTRY_CONFIG).slice(0, 5);

  return (
    <div className="relative h-full min-h-[320px] sm:min-h-[380px] rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/90 to-purple-500/10 p-6 sm:p-8 overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative h-full flex flex-col">
        <div className="text-center mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
            <Cloud className="h-3 w-3" />
            Cloud Architecture
          </span>
          <p className="mt-3 text-sm sm:text-base font-medium text-foreground">
            One SaaS core → Many industries
          </p>
        </div>

        {/* Central hub */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl animate-pulse" />
            <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30">
              <Layers className="h-9 w-9 sm:h-10 sm:w-10" />
            </div>
          </div>

          {/* Industry nodes */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-sm sm:max-w-md">
            {industries.map((name, i) => {
              const Icon = INDUSTRY_ICONS[name];
              const cfg = INDUSTRY_CONFIG[name];
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  viewport={{ once: true }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm text-xs sm:text-sm font-medium shadow-sm ${cfg.accentBg}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} />
                  <span className="hidden sm:inline">{name}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Connection lines visual */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <p className="text-xs text-muted-foreground text-center">
            Shared infrastructure · Isolated tenant data
          </p>
        </div>
      </div>
    </div>
  );
}

export const SaaSPlatformSection = () => {
  const router = useRouter();
  const featured = SAAS_PILLARS.find((p) => p.highlight);
  const others = SAAS_PILLARS.filter((p) => !p.highlight);
  const FeaturedIcon = featured ? ICONS[featured.icon] : Layers;

  return (
    <section id="platform" className="landing-section-alt py-16 sm:py-20 lg:py-28 scroll-mt-20 relative overflow-hidden">
      <div className="absolute inset-0 landing-dot-pattern opacity-25 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[100px] pointer-events-none" />

      <LandingContainer className="relative">
        <SectionHeader
          badge="Why SmartPOS SaaS"
          title="Built for Scale. Tuned for Your Industry."
          description="Enterprise cloud infrastructure meets vertical-specific intelligence — so you grow without rebuilding your stack."
        />

        {/* Stats strip */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14 w-full"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          {PLATFORM_STATS.map((stat) => {
            const StatIcon = ICONS[stat.icon];
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 shrink-0">
                  <StatIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-bold text-foreground truncate">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Main split layout */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 w-full">
          {/* Left — architecture visual */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <PlatformArchitecture />
          </motion.div>

          {/* Right — featured + grid */}
          <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
            {/* Featured pillar */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="relative rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card/90 to-purple-500/10 p-6 sm:p-8 shadow-xl shadow-primary/10 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
                  <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary text-primary-foreground shadow-lg shrink-0">
                    <FeaturedIcon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl sm:text-2xl font-bold">{featured.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground">
                        {featured.metric}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                      {featured.description}
                    </p>
                    {featured.features && (
                      <ul className="grid sm:grid-cols-3 gap-2 mb-5">
                        {featured.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      size="sm"
                      className="group/btn shadow-md"
                      onClick={() => document.getElementById("industries")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Explore Industries
                      <ArrowRight className="ml-1.5 h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Remaining pillars — 2x2 grid on desktop */}
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
              {others.map((pillar, index) => {
                const Icon = ICONS[pillar.icon];
                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    viewport={{ once: true }}
                    className="group relative rounded-xl sm:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5 hover:border-primary/35 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-muted/80 group-hover:bg-primary/10 transition-colors shrink-0">
                        <Icon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                            {pillar.title}
                          </h4>
                          <span className="text-[10px] font-medium text-primary/80 whitespace-nowrap hidden sm:inline">
                            {pillar.metric}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA bar */}
        <motion.div
          className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl border border-border/60 bg-gradient-to-r from-card/90 via-primary/5 to-card/90 backdrop-blur-sm w-full"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="text-center sm:text-left">
            <p className="font-semibold text-foreground text-sm sm:text-base">
              Ready to deploy for your industry?
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              14-day free trial · No credit card · Cancel anytime
            </p>
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto shadow-lg group shrink-0"
            onClick={() => router.push("/sign-up")}
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </motion.div>
      </LandingContainer>
    </section>
  );
};
