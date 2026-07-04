"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function VideoModal({ open, onOpenChange, src, title = "Video" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] sm:max-w-4xl p-0 overflow-hidden bg-black border-0 gap-0"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative aspect-video w-full bg-black">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            aria-label="Close video"
          >
            <X className="h-5 w-5" />
          </button>
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          >
            Your browser does not support video playback.
          </video>
        </div>
        {title && (
          <div className="px-4 py-3 bg-card border-t border-border">
            <p className="text-sm font-medium text-foreground">{title}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
