"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useGetAllPlansQuery } from "@/features/planApi";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";

export const PricingSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: plans = [], isLoading } = useGetAllPlansQuery();
  const [isAnnual, setIsAnnual] = useState(false);

  const goToIndustryStep = (planId) => {
    const query = new URLSearchParams();
    query.set("step", "2");
    if (planId) query.set("plan", planId);

    const url = `/sign-up?${query.toString()}`;
    if (pathname?.startsWith("/sign-up")) {
      router.replace(url, { scroll: false });
    } else {
      router.push(url);
    }
  };


  const PlanCard = ({ plan }) => {
    const isPopular = plan.popular;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className={`relative h-full ${isPopular ? "pt-4 sm:pt-0" : ""}`}
      >
        {isPopular && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-yellow-400 to-orange-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        )}

        <Card
          className={`h-full flex flex-col border transition-all duration-300 cursor-pointer
            ${
              isPopular
                ? "border-primary shadow-xl ring-1 ring-primary/20 scale-[1.02] sm:scale-100"
                : "border-border/60 hover:border-primary/40 hover:shadow-lg"
            }`}
          onClick={() => goToIndustryStep(plan._id)}
        >
          <CardHeader className="p-5 sm:p-6 pb-4">
            <div className="flex items-center justify-between mb-2 gap-2">
              <CardTitle className="text-xl sm:text-2xl font-bold">{plan.name}</CardTitle>
              {plan.name === "Starter" && <Zap className="h-5 w-5 text-amber-500 shrink-0" />}
              {plan.name === "Professional" && <Crown className="h-5 w-5 text-purple-500 shrink-0" />}
              {plan.name === "Enterprise" && <Sparkles className="h-5 w-5 text-cyan-500 shrink-0" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-bold">
                ${isAnnual ? Math.round(plan.price * 0.8) : plan.price}
              </span>
              <span className="text-sm text-muted-foreground">
                /{isAnnual ? "year" : plan.interval}
              </span>
            </div>
            <CardDescription className="mt-2 text-sm sm:text-base">{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="px-5 sm:px-6 pb-4 flex-1 space-y-2.5">
            {[
              `Up to ${plan.limitations.maxStaff} staff`,
              `Up to ${plan.limitations.maxVendors} vendors`,
              `Up to ${plan.limitations.maxInventoryItems} items`,
              ...plan.limitations.features,
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </CardContent>

          <CardFooter className="p-5 sm:p-6 pt-0">
            <Button
              className="w-full h-11"
              variant={isPopular ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                goToIndustryStep(plan._id);
              }}
            >
              Select Plan
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <section id="pricing" className="py-16 sm:py-20 lg:py-24 scroll-mt-20">
        <LandingContainer>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        </LandingContainer>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-linear-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Pricing Plans
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start free and scale as you grow. No hidden fees, cancel anytime.
          </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
            <span
              className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-primary rounded-full transition-colors"
              aria-label="Toggle annual billing"
            >
              <motion.div
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: isAnnual ? "calc(100% - 1.25rem)" : "0.25rem" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </button>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
              >
                Annual
              </span>
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0">
                Save 20%
              </Badge>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
          {plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan} />
          ))}
        </div>

        <motion.div
          className="text-center mt-12 sm:mt-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">
            Trusted by businesses worldwide
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground w-full">
            {["No credit card required", "Free 14-day trial", "Cancel anytime", "24/7 support"].map(
              (item, i) => (
                <div key={i} className="flex items-center justify-center sm:justify-start gap-2">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </LandingContainer>
    </section>
  );
};
