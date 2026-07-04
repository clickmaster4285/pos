"use client";

import { useState } from "react";
import { Play, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { VideoModal } from "./VideoModal";

export function VideoCard({
  src,
  poster,
  title,
  tag,
  duration,
  className = "",
  aspectClass = "aspect-video",
  size = "default",
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/30 text-left shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-300 ${aspectClass} ${className}`}
        whileHover={{ scale: size === "large" ? 1.01 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {poster && (
          <img
            src={poster}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        {tag && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground shadow-md">
            {tag}
          </span>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping scale-150 opacity-40 group-hover:opacity-60" />
            <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 text-primary shadow-2xl group-hover:scale-110 transition-transform duration-300">
              <Play className="h-6 w-6 sm:h-7 sm:w-7 ml-1 fill-primary" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p className={`font-semibold text-white drop-shadow-md ${size === "large" ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>
            {title}
          </p>
          {duration && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs text-white/80">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}
        </div>
      </motion.button>

      <VideoModal open={open} onOpenChange={setOpen} src={src} title={title} />
    </>
  );
}
