import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../../types";
import ProductCard from "../ui/ProductCard";

interface ProductCarouselProps {
  products: Product[];
  /** card width class — default w-[200px] */
  cardWidth?: string;
}

export default function ProductCarousel({ products, cardWidth = "w-[200px]" }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="vx-arrow absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Scroll container */}
      <div ref={scrollRef} className="vx-scroll">
        {products.map((p) => (
          <div key={p.id} className={`${cardWidth} flex-shrink-0`}>
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="vx-arrow absolute -right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

