"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQ_ITEMS } from "@/constants/landingContent";
import { ChevronDown, HelpCircle } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card/60 backdrop-blur-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-sm sm:text-base text-foreground pr-2">{item.question}</span>
        <ChevronDown
          className={`h-5 w-5 text-primary shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <LandingContainer>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 w-full items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-24"
          >
            <SectionHeader
              badge="FAQ"
              title="Questions? We've Got Answers."
              description="Everything you need to know before getting started. Can't find what you're looking for? Our support team is available 24/7."
              align="left"
              className="mb-6"
            />
            <div className="hidden lg:flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <HelpCircle className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="font-medium text-sm">Need help choosing a plan?</p>
                <p className="text-sm text-muted-foreground">Contact us at hello@smartpos.com</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="space-y-3 sm:space-y-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={item.question}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </motion.div>
        </div>
      </LandingContainer>
    </section>
  );
};
