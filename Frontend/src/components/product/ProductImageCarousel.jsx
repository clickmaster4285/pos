// components/ProductImageCarousel.jsx
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductImageCarousel({ 
  imgUrls, 
  apiUrl, 
  className, 
  alt,
  showCounter = true,
  showArrows = true 
}) {
  const [index, setIndex] = useState(0);

  // Normalize imgUrls to array
  const urls = Array.isArray(imgUrls)
    ? imgUrls.filter(Boolean)
    : imgUrls
    ? [imgUrls]
    : [];

  // Default class if not provided
  const defaultClass = "h-10 w-10 rounded-xl object-cover";
  const imgClass = className || defaultClass;

  // No images → show icon
  if (urls.length === 0) {
    return (
      <div className={`${imgClass} bg-muted text-muted-foreground grid place-items-center border`}>
        <Tag className="h-5 w-5" />
      </div>
    );
  }

  // Handle image error
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const fallback = e.target.nextSibling;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  // Only one image → no carousel controls
  if (urls.length === 1) {
    return (
      <>
        <img
          src={`${apiUrl}${urls[0]}`}
          alt={alt || "Product"}
          className={imgClass}
          onError={handleImageError}
        />
        {/* Fallback for broken images */}
        <div 
          className={`${imgClass} bg-muted text-muted-foreground grid place-items-center border hidden`}
        >
          <Tag className="h-5 w-5" />
        </div>
      </>
    );
  }

  const prev = (e) => {
    e?.stopPropagation();
    setIndex((i) => (i - 1 + urls.length) % urls.length);
  };

  const next = (e) => {
    e?.stopPropagation();
    setIndex((i) => (i + 1) % urls.length);
  };

  return (
    <div className="relative inline-block group">
      <img
        src={`${apiUrl}${urls[index]}`}
        alt={alt || "Product"}
        className={imgClass}
        onError={handleImageError}
      />

      {/* Fallback for broken images */}
      <div 
        className={`${imgClass} bg-muted text-muted-foreground grid place-items-center border hidden`}
      >
        <Tag className="h-5 w-5" />
      </div>

      {/* Navigation Arrows - Only show if enabled and multiple images */}
      {showArrows && urls.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm"
            onClick={prev}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm"
            onClick={next}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </>
      )}

      {/* Counter - Only show if enabled and multiple images */}
      {showCounter && urls.length > 1 && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-md">
          {index + 1}/{urls.length}
        </div>
      )}
    </div>
  );
}