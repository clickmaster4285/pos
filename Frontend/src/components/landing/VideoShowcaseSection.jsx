"use client";

import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { motion } from "framer-motion";
import { LANDING_VIDEOS } from "@/constants/landingContent";
import { VideoCard } from "./VideoCard";

export const VideoShowcaseSection = () => {
  const { showcase, clips } = LANDING_VIDEOS;

  return (
    <section id="demo" className="landing-section-alt py-16 sm:py-20 lg:py-24 scroll-mt-20 relative overflow-hidden">
      <div className="absolute inset-0 landing-dot-pattern opacity-20 pointer-events-none" />

      <LandingContainer className="relative">
        <SectionHeader
          badge="Platform Demo"
          title="See the SaaS Platform in Motion"
          description="Watch how multi-industry teams run checkout, inventory, and analytics from one cloud dashboard."
        />

        <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 w-full">
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <VideoCard
              src={showcase.src}
              poster={showcase.poster}
              title={showcase.title}
              duration={showcase.duration}
              tag="Full Demo"
              size="large"
              aspectClass="aspect-video sm:aspect-[16/10]"
            />
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 sm:gap-6">
            {clips.map((clip, i) => (
              <motion.div
                key={clip.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <VideoCard
                  src={clip.src}
                  poster={clip.poster}
                  title={clip.title}
                  tag={clip.tag}
                  aspectClass="aspect-video sm:aspect-[16/10] lg:aspect-[16/9]"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </LandingContainer>
    </section>
  );
};
