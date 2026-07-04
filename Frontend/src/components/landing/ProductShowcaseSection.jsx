"use client";

import { useState } from "react";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { motion, AnimatePresence } from "framer-motion";
import { LANDING_VIDEOS } from "@/constants/landingContent";
import { Play, Pause } from "lucide-react";

const TABS = [
  { id: "pos", key: "pos" },
  { id: "inventory", key: "inventory" },
  { id: "analytics", key: "analytics" },
];

export const ProductShowcaseSection = () => {
  const [activeTab, setActiveTab] = useState("pos");
  const [isPlaying, setIsPlaying] = useState(true);
  const tab = LANDING_VIDEOS.tabs[activeTab];

  return (
    <section id="showcase" className="py-16 sm:py-20 lg:py-24 scroll-mt-20 bg-muted/20">
      <LandingContainer>
        <SectionHeader
          badge="Module Preview"
          title="Core SaaS Modules — Live Preview"
          description="Every industry gets the same powerful engine: POS, inventory, and analytics — configured for your workflow."
        />

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {TABS.map(({ id, key }) => {
            const data = LANDING_VIDEOS.tabs[key];
            const isActive = activeTab === key;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setIsPlaying(true);
                }}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : "bg-background border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {data.label}
              </button>
            );
          })}
        </div>

        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/60 shadow-2xl bg-black">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <span className="text-xs text-white/70 ml-2 hidden sm:inline">
                SmartPOS — {tab.label}
              </span>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label={isPlaying ? "Pause preview" : "Play preview"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="aspect-video sm:aspect-[16/9]"
              >
                <video
                  key={`${activeTab}-${isPlaying}`}
                  src={tab.src}
                  poster={tab.poster}
                  autoPlay={isPlaying}
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{tab.label}</h3>
              <p className="text-sm text-white/80 max-w-xl">{tab.description}</p>
            </div>
          </div>
        </motion.div>
      </LandingContainer>
    </section>
  );
};
