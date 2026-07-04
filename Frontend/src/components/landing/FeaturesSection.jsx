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
    <section id="features" className="py-20 bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Comprehensive tools designed to streamline operations, boost sales, and enhance customer experience.
          </p>
        </motion.div>

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
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm group">
                <CardHeader>
                  <div className={`p-3 rounded-2xl ${feature.bgColor} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center p-8 rounded-2xl bg-linear-to-br from-primary/5 to-accent/5 border border-border/50 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <stat.icon className="h-8 w-8 text-primary" />
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
              <div className="text-4xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </LandingContainer>
    </section>
  );
};
