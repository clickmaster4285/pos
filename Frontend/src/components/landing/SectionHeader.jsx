"use client";

import { motion } from "framer-motion";

export function SectionHeader({ badge, title, description, align = "center", className = "" }) {
  const isCenter = align === "center";

  return (
    <motion.div
      className={`mb-10 sm:mb-14 w-full ${isCenter ? "text-center" : "text-left"} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {badge && (
        <span className="inline-flex items-center mb-4 px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-primary/30 bg-primary/5 text-primary">
          {badge}
        </span>
      )}
      <h2
        className={`text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold mb-4 sm:mb-5 tracking-tight leading-tight ${isCenter ? "max-w-4xl mx-auto" : ""}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-base sm:text-lg text-muted-foreground leading-relaxed ${isCenter ? "max-w-3xl mx-auto" : "max-w-xl"}`}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}
