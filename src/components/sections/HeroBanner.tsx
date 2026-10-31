import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { heroBanners } from "../../data/products";
import { handleImageError } from "../../utils";

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const total = heroBanners.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-advance every 5 s
  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const banner = heroBanners[current];

  return (
    <section id="hero" className="relative w-full overflow-hidden" style={{ minHeight: "420px" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="w-full"
          style={{
            background: `linear-gradient(135deg, ${banner.bgFrom} 0%, ${banner.bgTo} 60%, #000 100%)`,
          }}
        >
          <div className="vx-container flex flex-col md:flex-row items-center gap-8 py-12 md:py-0 md:min-h-[420px]">
            {/* ── Left: text ── */}
            <div className="flex-1 text-white z-10 flex flex-col gap-4">
              <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white/90
                               text-[11px] font-semibold px-3 py-1 rounded-full w-fit tracking-wide">
                {banner.tag}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-6xl font-extrabold uppercase leading-[1.08] tracking-[-0.02em] whitespace-pre-line">
                {banner.headline}
              </h1>
              <p className="text-white/80 text-sm sm:text-base font-normal tracking-normal max-w-md">{banner.subheadline}</p>
              <ul className="space-y-2">
                {banner.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-white/80">
                    <CheckCircle size={14} className="text-volt-yellow flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={banner.ctaLink} className="btn-volt w-fit mt-2">
                {banner.ctaLabel}
              </Link>
            </div>

            {/* ── Right: product image ── */}
            <div className="flex-1 flex justify-center items-end md:items-center">
              <img
                src={banner.imageUrl}
                alt={banner.headline.replace("\n", " ")}
                className="w-full max-w-[480px] h-[280px] md:h-[380px] object-cover object-center rounded-xl"
                style={{ maskImage: "linear-gradient(to bottom, white 70%, transparent 100%)" }}
                onError={(e) => handleImageError(e, "PLUXPC Featured")}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Prev/Next controls ── */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 vx-arrow bg-black/30 border-white/20 text-white hover:bg-black/50"
        aria-label="Previous"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 vx-arrow bg-black/30 border-white/20 text-white hover:bg-black/50"
        aria-label="Next"
      >
        <ChevronRight size={18} />
      </button>

      {/* ── Dots ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

