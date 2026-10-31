import { useRef, useState, useEffect, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  X,
} from "lucide-react";
import { handleImageError } from "../../utils";

interface ProductImageGalleryProps {
  images: string[];
  selectedImage: string;
  onSelectImage: (img: string) => void;
  productName: string;
  categoryLabel?: string;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  activePromotion?: {
    badgeText?: string;
    discountType?: string;
    discountValue?: number;
  } | null;
  badge?: string;
  badgeIcon?: string;
  featureTag?: string;
}

/**
 * Derives a higher-resolution version of an image if available (e.g. Unsplash w=1800)
 */
function getHighResImageUrl(url: string): string {
  if (!url) return "";
  if (url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/, "w=1800").replace(/q=\d+/, "q=90");
  }
  return url;
}

export default function ProductImageGallery({
  images,
  selectedImage,
  onSelectImage,
  productName,
  categoryLabel,
  isWishlisted,
  onWishlistToggle,
  activePromotion,
  badge,
  badgeIcon,
  featureTag,
}: ProductImageGalleryProps) {
  const thumbnailListRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Normalize display images (strictly non-empty, deduplicated)
  const rawList = images && images.length > 0 ? images : (selectedImage ? [selectedImage] : []);
  const displayImages = rawList.filter((img) => typeof img === "string" && img.trim().length > 0);
  const activeImage =
    selectedImage && displayImages.includes(selectedImage)
      ? selectedImage
      : displayImages[0] || "";

  // Check scroll bounds of vertical thumbnail list
  const updateScrollBounds = useCallback(() => {
    const el = thumbnailListRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 4);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
  }, []);

  useEffect(() => {
    updateScrollBounds();
    const el = thumbnailListRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollBounds);
    window.addEventListener("resize", updateScrollBounds);

    return () => {
      el.removeEventListener("scroll", updateScrollBounds);
      window.removeEventListener("resize", updateScrollBounds);
    };
  }, [displayImages.length, updateScrollBounds]);

  // Scroll thumbnails vertically
  const scrollThumbnails = (direction: "up" | "down") => {
    const el = thumbnailListRef.current;
    if (!el) return;
    const scrollAmount = 88; // Height of thumbnail + gap
    el.scrollBy({
      top: direction === "up" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Keyboard navigation across thumbnails in inline gallery
  const handleThumbnailKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (index + 1) % displayImages.length;
      onSelectImage(displayImages[nextIndex]);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (index - 1 + displayImages.length) % displayImages.length;
      onSelectImage(displayImages[prevIndex]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectImage(displayImages[index]);
    }
  };

  // Lightbox handlers
  const openLightbox = (indexToOpen?: number) => {
    const idx = typeof indexToOpen === "number" ? indexToOpen : displayImages.indexOf(activeImage);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const prevLightboxImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  const nextLightboxImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  // Lock body scroll and register keyboard listeners while lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        prevLightboxImage();
      } else if (e.key === "ArrowRight") {
        nextLightboxImage();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, prevLightboxImage, nextLightboxImage]);

  return (
    <>
      <div className="flex flex-col-reverse lg:flex-row gap-4 sm:gap-6 items-start w-full">
        {/* ── Left Side: Vertical Thumbnail Slider (Desktop) / Horizontal (Mobile) ── */}
        {displayImages.length > 0 && (
          <div className="flex lg:flex-col items-center gap-1.5 w-full lg:w-[78px] flex-shrink-0">
            {/* Desktop Up Chevron Button (shown when more than 3 images exist) */}
            {displayImages.length > 3 && (
              <button
                type="button"
                onClick={() => scrollThumbnails("up")}
                disabled={!canScrollUp}
                aria-label="Scroll thumbnails up"
                className="hidden lg:flex w-full items-center justify-center py-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp size={18} />
              </button>
            )}

            {/* Thumbnail Track */}
            <div
              ref={thumbnailListRef}
              tabIndex={-1}
              className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto max-h-[460px] w-full py-1 px-0.5 no-scrollbar scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {displayImages.map((imgUrl, idx) => {
                const isSelected = activeImage === imgUrl;
                return (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => onSelectImage(imgUrl)}
                    onKeyDown={(e) => handleThumbnailKeyDown(e, idx)}
                    aria-label={`View ${productName} image ${idx + 1} of ${displayImages.length}`}
                    aria-current={isSelected ? "true" : "false"}
                    className={`relative w-16 h-16 sm:w-18 sm:h-18 lg:w-[72px] lg:h-[72px] rounded-xl overflow-hidden bg-white p-1 flex-shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                      isSelected
                        ? "border-2 border-gray-950 ring-2 ring-gray-950/15 shadow-sm scale-102"
                        : "border border-gray-200/90 hover:border-gray-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${productName} thumbnail angle ${idx + 1}`}
                      className="w-full h-full object-contain object-center"
                      loading="lazy"
                      onError={(e) => handleImageError(e, categoryLabel || productName)}
                    />
                  </button>
                );
              })}
            </div>

            {/* Desktop Down Chevron Button (shown when more than 3 images exist) */}
            {displayImages.length > 3 && (
              <button
                type="button"
                onClick={() => scrollThumbnails("down")}
                disabled={!canScrollDown}
                aria-label="Scroll thumbnails down"
                className="hidden lg:flex w-full items-center justify-center py-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            )}
          </div>
        )}

        {/* ── Right Side: Large Primary Product Image Container with Lightbox Trigger ── */}
        <div
          onClick={() => openLightbox()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLightbox();
            }
          }}
          aria-label={`Enlarge ${productName} image`}
          className="relative flex-1 w-full bg-[#F8F9FA] rounded-3xl border border-gray-100/90 aspect-square flex items-center justify-center p-6 sm:p-10 overflow-hidden group shadow-2xs cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-volt-red"
        >
          {/* Main Product Image (Clean Floating Presentation, object-contain for all product shapes) */}
          <img
            src={activeImage}
            alt={productName}
            className="w-full h-full object-contain object-center max-h-[500px] transition-transform duration-500 ease-out group-hover:scale-105 select-none"
            onError={(e) => handleImageError(e, categoryLabel || productName)}
          />

          {/* Click to expand hover chip */}
          <div className="absolute top-4 right-16 sm:right-20 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none shadow-md">
            <Maximize2 size={12} />
            <span>Click to zoom</span>
          </div>

          {/* Top-Left Promotional & Feature Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-2 pointer-events-none">
            {activePromotion ? (
              <div className="flex items-center gap-1.5 bg-volt-red text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md">
                <span>⚡</span>
                <span>
                  {activePromotion.badgeText ||
                    (activePromotion.discountType === "percentage"
                      ? `${activePromotion.discountValue}% OFF`
                      : `₹${activePromotion.discountValue} OFF`)}
                </span>
              </div>
            ) : badge ? (
              <div className="flex items-center gap-1.5 bg-gray-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
                {badgeIcon && <span>{badgeIcon}</span>}
                <span>{badge}</span>
              </div>
            ) : null}

            {featureTag && (
              <div className="bg-amber-400 text-gray-950 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                {featureTag}
              </div>
            )}
          </div>

          {/* Bottom-Right Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle();
            }}
            aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            className={`absolute bottom-4 right-4 z-10 w-11 h-11 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-90 border border-gray-100 ${
              isWishlisted ? "text-red-500" : "text-gray-700 hover:text-gray-950"
            }`}
          >
            <Heart
              size={20}
              className={`transition-colors ${
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── High-Quality Lightbox Modal (Click Main Image Preview) ── */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} full-screen image preview`}
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
        >
          {/* Top Bar: Title, Counter & Close Button */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between text-white w-full max-w-6xl mx-auto z-10"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                {categoryLabel || "PLUXPC Audio & Tech"}
              </p>
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                {productName}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-300 font-medium px-2.5 py-1 bg-white/10 rounded-full">
                {lightboxIndex + 1} / {displayImages.length}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Close image preview"
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Center Area: Main Enlarged Image & Navigation Chevrons */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto my-auto px-2 sm:px-12"
          >
            {/* Previous Image Chevron */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={prevLightboxImage}
                aria-label="View previous image"
                className="absolute left-0 sm:left-2 z-20 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* High-Resolution Image Container (Preserves Aspect Ratio, object-contain) */}
            <div className="max-w-full max-h-[75vh] flex items-center justify-center p-2">
              <img
                src={getHighResImageUrl(displayImages[lightboxIndex])}
                alt={`${productName} high resolution angle ${lightboxIndex + 1}`}
                className="max-w-full max-h-[72vh] sm:max-h-[76vh] object-contain object-center drop-shadow-2xl rounded-lg"
                onError={(e) => handleImageError(e, categoryLabel || productName)}
              />
            </div>

            {/* Next Image Chevron */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={nextLightboxImage}
                aria-label="View next image"
                className="absolute right-0 sm:right-2 z-20 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all backdrop-blur-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnail Jump Strip (When multiple images exist) */}
          {displayImages.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 max-w-3xl mx-auto z-10"
            >
              {displayImages.map((thumbUrl, idx) => {
                const isCurrent = lightboxIndex === idx;
                return (
                  <button
                    key={`lb-thumb-${idx}`}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    aria-label={`Jump to image ${idx + 1}`}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-white/10 p-0.5 transition-all flex-shrink-0 ${
                      isCurrent
                        ? "ring-2 ring-white scale-110 opacity-100 bg-white"
                        : "opacity-40 hover:opacity-80"
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain object-center rounded"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
