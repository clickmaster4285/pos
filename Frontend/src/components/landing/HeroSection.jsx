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

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-background to-purple-50/20 dark:from-blue-950/10 dark:via-background dark:to-purple-950/10"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Enhanced Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 backdrop-blur-sm animate-pulse">
              <Shield className="w-3 h-3 mr-1" />
              Trusted by 10,000+ Businesses Worldwide
            </Badge>
          </motion.div>

          {/* Improved Text Gradients */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-gray-900 via-blue-700 to-gray-800 dark:from-white dark:via-blue-300 dark:to-gray-300 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Revolutionize Your
            <span className="block bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Business Operations
            </span>
          </motion.h1>

          {/* Enhanced Button Colors */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Button
              onClick={() => router.push('/sign-up')}
              size="lg"
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl hover:shadow-blue-500/25 hover:scale-105 transition-all duration-300 group text-white"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-950/20 hover:scale-105 transition-all duration-300"
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
