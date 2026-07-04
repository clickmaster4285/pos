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
    <>
      <section id="industries" className="py-20 bg-linear-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 text-primary border-primary/30">
              Industry Solutions
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Built for Your Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tailored solutions for every business type. Click any industry to explore specialized features designed for your success.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {industries.map((industry, index) => (
                <motion.div
                  key={industry.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="h-full cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm overflow-hidden group"
                    onClick={() => setSelectedIndustry(industry)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${industry.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                          <industry.icon className={`h-8 w-8 ${industry.color}`} />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                        {industry.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-2 leading-relaxed">
                        {industry.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {industry.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <Check className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-primary">Key Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedIndustry.detailedFeatures.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="text-lg font-semibold mb-2 text-primary">Business Benefits</h4>
                  <p className="text-muted-foreground">{selectedIndustry.benefits}</p>
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
