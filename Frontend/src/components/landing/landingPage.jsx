"use client";

import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustedByMarquee } from "@/components/landing/TrustedByMarquee";
import { IndustriesSection } from "@/components/landing/IndustriesSection";
import { SaaSPlatformSection } from "@/components/landing/SaaSPlatformSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CompleteFlowSection } from "@/components/landing/CompleteFlowSection";
import { VideoShowcaseSection } from "@/components/landing/VideoShowcaseSection";
import { ProductShowcaseSection } from "@/components/landing/ProductShowcaseSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden scroll-smooth">
      <Navigation />
      <main>
        <HeroSection />
        <TrustedByMarquee />
        <IndustriesSection />
        <SaaSPlatformSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CompleteFlowSection />
        <VideoShowcaseSection />
        <ProductShowcaseSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
