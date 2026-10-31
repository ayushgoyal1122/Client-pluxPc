import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { PromotionalPoster } from "../../types";
import { handleImageError } from "../../utils";

interface ProductStorytellingPostersProps {
  productName: string;
  categoryLabel?: string;
  posters?: PromotionalPoster[];
}

export default function ProductStorytellingPosters({
  productName,
  categoryLabel,
  posters = [],
}: ProductStorytellingPostersProps) {
  // Modal state for first poster popup
  const [popupImage, setPopupImage] = useState<{ image: string; title?: string } | null>(null);

  // Lock body scroll and listen for Escape key when popup is open
  useEffect(() => {
    if (!popupImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupImage(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [popupImage]);

  // If no promotional posters exist for this product, do not render
  if (!posters || posters.length === 0) {
    return null;
  }

  // Limit to at most three distinct promotional posters per product
  const sortedPosters = [...posters]
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 3);

  return (
    <section
      aria-label={`${productName} Promotional Storytelling`}
      className="border-t border-gray-100 pt-12 sm:pt-16 mb-16"
    >
      {/* Section Header */}
      <div className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto px-4">
        <p className="text-xs font-black uppercase tracking-widest text-volt-red mb-2">
          Experience {productName}
        </p>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-950 tracking-tight">
          Crafted for Extraordinary Performance
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          Discover the technology, ergonomic engineering, and craftsmanship behind every detail.
        </p>
      </div>

      {/* Vertically Stacked Promotional Posters (Exactly 3 per product) */}
      <div className="space-y-8 sm:space-y-12">
        {sortedPosters.map((poster, index) => {
          const hasCopy = poster.title || poster.description || poster.tag;
          const isFirstPoster = index === 0;

          return (
            <div
              key={`${poster.image}-${index}`}
              onClick={isFirstPoster ? () => setPopupImage({ image: poster.image, title: poster.title }) : undefined}
              role={isFirstPoster ? "button" : undefined}
              tabIndex={isFirstPoster ? 0 : undefined}
              onKeyDown={
                isFirstPoster
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPopupImage({ image: poster.image, title: poster.title });
                      }
                    }
                  : undefined
              }
              aria-label={isFirstPoster ? `Click to enlarge first poster for ${productName}` : undefined}
              className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-950 border border-gray-200/80 shadow-md group transition-all ${
                isFirstPoster ? "cursor-pointer focus:outline-none focus:ring-4 focus:ring-volt-red/20" : ""
              }`}
            >

              {/* High-Resolution Poster Image */}
              <img
                src={poster.image}
                alt={poster.alt || `${productName} showcase ${index + 1}`}
                className="w-full h-auto object-cover max-h-[520px] sm:max-h-[640px] md:max-h-[720px] group-hover:scale-[1.01] transition-transform duration-700 select-none"
                loading="lazy"
                onError={(e) => handleImageError(e, categoryLabel || productName)}
              />

              {/* Cinematic Bottom Gradient Overlay & Product Storytelling Copy */}
              {hasCopy && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 sm:p-10 pt-24 flex flex-col justify-end text-left pointer-events-none">
                  {poster.tag && (
                    <div className="mb-2.5">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-volt-red text-white shadow-sm">
                        {poster.tag}
                      </span>
                    </div>
                  )}

                  {poster.title && (
                    <h3 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm mb-2 max-w-3xl">
                      {poster.title}
                    </h3>
                  )}

                  {poster.description && (
                    <p className="text-xs sm:text-sm md:text-base text-gray-200 leading-relaxed max-w-2xl drop-shadow-xs">
                      {poster.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── High-Resolution Lightbox Popup for the First Poster ── */}
      {popupImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} poster preview modal`}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setPopupImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setPopupImage(null)}
              aria-label="Close image popup"
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-30 w-10 h-10 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-all shadow-lg border border-white/20 active:scale-90"
            >
              <X size={20} />
            </button>

            {/* Poster Image in Full Detail */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-black max-h-[85vh] flex items-center justify-center border border-white/10">
              <img
                src={popupImage.image}
                alt={popupImage.title || `${productName} poster preview`}
                className="max-h-[85vh] max-w-full w-auto h-auto object-contain select-none"
              />
              {popupImage.title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 text-white text-center">
                  <h4 className="text-base sm:text-xl font-bold tracking-tight drop-shadow-md">
                    {popupImage.title}
                  </h4>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
