"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import {
  BarChart3,
  Users,
  CreditCard,
  Smartphone,
  Cloud,
  Shield,
  Layers,
  Globe,
} from "lucide-react";

const BENTO_FEATURES = [
  {
    icon: Layers,
    title: "Industry Workflows",
    description: "Vertical-specific product fields, reports, and UX — auto-configured at sign-up.",
    className: "sm:col-span-2 lg:row-span-2",
    gradient: "from-primary/15 to-purple-500/10",
    large: true,
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description: "Real-time dashboards per location and industry KPIs.",
    className: "",
    gradient: "from-blue-500/10 to-cyan-500/5",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Automatic backups and instant multi-device sync.",
    className: "",
    gradient: "from-cyan-500/10 to-blue-500/5",
  },
  {
    icon: Users,
    title: "CRM & Loyalty",
    description: "Customer profiles, rewards, and purchase history.",
    className: "",
    gradient: "from-green-500/10 to-emerald-500/5",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Cards, wallets, split pay — integrated processors.",
    className: "",
    gradient: "from-purple-500/10 to-pink-500/5",
  },
  {
    icon: Globe,
    title: "Multi-Location",
    description: "Manage franchises and stores from one SaaS admin.",
    className: "sm:col-span-2",
    gradient: "from-orange-500/10 to-amber-500/5",
  },
  {
    icon: Smartphone,
    title: "Mobile POS",
    description: "Full counter and floor selling on any device.",
    className: "",
    gradient: "from-orange-500/10 to-red-500/5",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Encryption, RBAC, and tenant isolation.",
    className: "",
    gradient: "from-red-500/10 to-rose-500/5",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="landing-section-alt py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <LandingContainer>
        <SectionHeader
          badge="Platform Capabilities"
          title="Everything Your Industry Needs — Out of the Box"
          description="A unified SaaS toolkit that adapts to your vertical while sharing the same powerful core."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full auto-rows-fr">
          {BENTO_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              viewport={{ once: true }}
              className={`group relative rounded-2xl border border-border/60 bg-gradient-to-br ${feature.gradient} p-5 sm:p-6 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden ${feature.className}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
              <div className="relative">
                <div className="inline-flex p-2.5 rounded-xl bg-background/60 border border-border/40 mb-4 group-hover:border-primary/30 transition-colors">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3
                  className={`font-semibold mb-2 group-hover:text-primary transition-colors ${feature.large ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`text-muted-foreground leading-relaxed ${feature.large ? "text-sm sm:text-base max-w-md" : "text-sm"}`}
                >
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
};
