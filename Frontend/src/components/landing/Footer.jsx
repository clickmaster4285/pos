"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  ArrowUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { LandingContainer } from "./LandingContainer";

const QUICK_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Industries", href: "#industries" },
  { label: "Platform", href: "#platform" },
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const SOCIAL_ICONS = [Twitter, Facebook, Instagram, Linkedin];

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <LandingContainer className="py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 mb-10 sm:mb-12">
          <motion.div
            className="space-y-4 sm:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-primary">SmartPOS</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">
              Revolutionizing business operations with intelligent POS solutions. Trusted by
              thousands of businesses worldwide.
            </p>
            <div className="flex gap-2.5">
              {SOCIAL_ICONS.map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className="p-2.5 rounded-lg bg-background hover:bg-primary hover:text-primary-foreground border border-border/60 transition-all duration-200"
                  aria-label="Social link"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h4>
            <div className="space-y-2.5">
              {QUICK_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact Us
            </h4>
            <div className="space-y-3">
              {[
                { icon: Phone, text: "+1 (555) 123-4567" },
                { icon: Mail, text: "hello@smartpos.com" },
                { icon: MapPin, text: "123 Business Ave, Suite 100, New York, NY 10001" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2.5 text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="space-y-4 sm:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Stay Updated
            </h4>
            <p className="text-sm text-muted-foreground">
              Subscribe for updates on new features and industry insights.
            </p>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <Input
                type="email"
                placeholder="Enter your email"
                className="h-11 bg-background"
              />
              <Button className="h-11 shrink-0 shadow-md">Subscribe</Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} SmartPOS. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a key={item} href="#" className="hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </motion.div>
      </LandingContainer>
    </footer>
  );
};
