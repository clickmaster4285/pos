"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  ArrowRight,
  Play,
  Sparkles,
  Utensils,
  Shirt,
  Pill,
  Laptop,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LANDING_VIDEOS, INDUSTRY_CONFIG } from "@/constants/landingContent";
import { VideoCard } from "./VideoCard";
import { VideoModal } from "./VideoModal";
import { LandingContainer } from "./LandingContainer";

const INDUSTRY_ICONS = {
  Restaurant: Utensils,
  Fashion: Shirt,
  Pharmacy: Pill,
  Electronics: Laptop,
  "General Shop": Store,
};

const HERO_STATS = [
  { value: "5+", label: "Industry Verticals" },
  { value: "10K+", label: "Businesses on SaaS" },
  { value: "99.9%", label: "Cloud Uptime" },
];

export const HeroSection = () => {
  const router = useRouter();
  const [videoOpen, setVideoOpen] = useState(false);
  const { hero } = LANDING_VIDEOS;
  const industries = Object.keys(INDUSTRY_CONFIG);

  return (
    <section className="landing-hero relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-28">
      <div className="landing-grid-pattern absolute inset-0 pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <LandingContainer className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-16 items-center">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-wrap gap-2 justify-center lg:justify-start mb-5 sm:mb-6"
            >
              <Badge className="px-3 py-1 text-xs sm:text-sm font-medium bg-primary text-primary-foreground border-0 shadow-md shadow-primary/25">
                <Cloud className="w-3 h-3 mr-1.5" />
                Cloud SaaS Platform
              </Badge>
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs sm:text-sm border-primary/30 bg-primary/5 text-primary"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Multi-Industry POS
              </Badge>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold tracking-tight mb-4 sm:mb-6 leading-[1.1]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              One Platform.{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Every Industry.
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-blue-500/40 to-purple-500/60 rounded-full hidden sm:block" />
              </span>
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Industry-specific SaaS for restaurants, retail, pharmacy, electronics, and more.
              Subscribe once, configure for your vertical, and scale across unlimited locations.
            </motion.p>

            {/* Industry chips */}
            <motion.div
              className="flex flex-wrap gap-2 justify-center lg:justify-start mb-7 sm:mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              {industries.map((name) => {
                const Icon = INDUSTRY_ICONS[name];
                const cfg = INDUSTRY_CONFIG[name];
                return (
                  <a
                    key={name}
                    href="#industries"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-md transition-all ${cfg.accentBg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${cfg.accent}`} />
                    {name}
                  </a>
                );
              })}
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              <Button
                onClick={() => router.push("/sign-up")}
                size="lg"
                className="h-12 sm:h-12 text-base shadow-xl shadow-primary/20 hover:shadow-primary/30 group w-full sm:w-auto px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 sm:h-12 text-base w-full sm:w-auto border-2 bg-background/50 backdrop-blur-sm group"
                onClick={() => setVideoOpen(true)}
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch Platform Demo
              </Button>
            </motion.div>

            <motion.div
              className="grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto lg:mx-0 p-4 sm:p-0 rounded-2xl sm:rounded-none bg-card/40 sm:bg-transparent border border-border/40 sm:border-0 backdrop-blur-sm sm:backdrop-blur-none"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
            >
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight mt-0.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-purple-500/15 to-cyan-500/20 rounded-[2rem] blur-2xl opacity-70 pointer-events-none" />
            <VideoCard
              src={hero.src}
              poster={hero.poster}
              title={hero.title}
              duration={hero.duration}
              tag="Platform Demo"
              size="large"
              aspectClass="aspect-video sm:aspect-[4/3] lg:aspect-square xl:aspect-[4/3]"
            />
          </motion.div>
        </div>
      </LandingContainer>

      <VideoModal open={videoOpen} onOpenChange={setVideoOpen} src={hero.src} title={hero.title} />
    </section>
  );
};
