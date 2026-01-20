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

export const PricingSection = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: plans = [], isLoading } = useGetAllPlansQuery();
  const [isAnnual, setIsAnnual] = useState(false);

  // --------------------------------------------------------------
  //  Jump to Industry step (step=2) and optionally pre-select plan
  // --------------------------------------------------------------
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

  // --------------------------------------------------------------
  //  Render a single plan card
  // --------------------------------------------------------------
  const PlanCard = ({ plan }) => {
    const isPopular = plan.popular;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative"
      >
        {isPopular && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-yellow-400 to-orange-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        )}

        <Card
          className={`h-full border-2 transition-all duration-300 cursor-pointer
            ${isPopular ? "border-primary shadow-xl" : "border-border hover:border-primary/50"}`}
          onClick={() => goToIndustryStep(plan._id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              {plan.name === "Starter" && <Zap className="h-6 w-6 text-yellow-500" />}
              {plan.name === "Professional" && <Crown className="h-6 w-6 text-purple-500" />}
              {plan.name === "Enterprise" && <Sparkles className="h-6 w-6 text-cyan-500" />}
            </div>
            <div className="text-3xl font-bold">
              ${isAnnual ? Math.round(plan.price * 0.8) : plan.price}
              <span className="text-sm font-normal text-muted-foreground">
                /{isAnnual ? "year" : plan.interval}
              </span>
            </div>
            <CardDescription className="mt-2">{plan.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {[
              `Up to ${plan.limitations.maxStaff} staff`,
              `Up to ${plan.limitations.maxVendors} vendors`,
              `Up to ${plan.limitations.maxInventoryItems} items`,
              ...plan.limitations.features,
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </CardContent>

          <CardFooter>
            <Button
              className="w-full"
              variant={isPopular ? "default" : "outline"}
              size="lg"
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
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading plans…</p>
        </div>
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

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-primary rounded-full transition-all duration-300"
            >
              <motion.div
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                animate={{ left: isAnnual ? "calc(100% - 1.25rem)" : "0.25rem" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                Annual
              </span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                Save 20%
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={plan._id} plan={plan} />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground mb-6">Trusted by businesses worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            {["No credit card required", "Free 14-day trial", "Cancel anytime", "24/7 support"].map(
              (item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};