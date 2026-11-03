import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext";
import ProductCard from "../components/ui/ProductCard";
import type { SortOption } from "../types";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Top Rated", value: "rating" },
  { label: "Newest", value: "newest" },
];

export default function ProductsPage() {
  const { products: allProducts, categories: shopCategories } = useStorefront();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const section = searchParams.get("section") ?? "";
  const query = searchParams.get("q") ?? "";
  const [sort, setSort] = useState<SortOption>("featured");
  const [_sidebarOpen, setSidebarOpen] = useState(false);

  // Category horizontal scroll bar state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isOverflowing = scrollWidth > clientWidth + 2;
    setHasOverflow(isOverflowing);

    // Can scroll left if scrolled right by at least 2px
    setCanScrollLeft(scrollLeft > 2);

    // Can scroll right if there is content remaining beyond right boundary
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  // Update scroll detection on categories change, resize, or font load
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollButtons();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        updateScrollButtons();
      });
      observer.observe(el);
    }

    const handleResize = () => {
      updateScrollButtons();
    };

    window.addEventListener("resize", handleResize);
    const timer = setTimeout(updateScrollButtons, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
      clearTimeout(timer);
    };
  }, [shopCategories, updateScrollButtons]);

  // Ensure active category is kept within visible scrolling viewport
  useEffect(() => {
    if (!category || !scrollRef.current) return;
    const activeEl = scrollRef.current.querySelector<HTMLElement>(`[data-category="${category}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [category]);

  const handleScrollLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!scrollRef.current) return;
    const scrollAmount = Math.max(220, Math.floor(scrollRef.current.clientWidth * 0.65));
    scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const handleScrollRight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!scrollRef.current) return;
    const scrollAmount = Math.max(220, Math.floor(scrollRef.current.clientWidth * 0.65));
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (category) list = list.filter((p) => p.category === category);
    if (section) list = list.filter((p) => p.section?.includes(section));
    if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "newest": list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
    return list;
  }, [allProducts, category, section, query, sort]);

  const sectionLabels: Record<string, string> = {
    bestsellers: "Bestsellers",
    gaming: "Gaming Essentials",
    premium: "Premium Audio",
    everyday: "Everyday Tech",
    exclusive: "Exclusive Offers",
    hotpicks: "Hot Picks",
    topdeals: "Top Deals",
  };

  const categoryLabel =
    (category && shopCategories.find((c) => c.slug === category)?.name) ||
    (section && sectionLabels[section]) ||
    (section ? section.charAt(0).toUpperCase() + section.slice(1) : "All Products");

  return (
    <div className="vx-container py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {query ? `Search: "${query}"` : categoryLabel}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={15} /> Filter
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:border-gray-400"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category navigation bar with Previous / Next navigation */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 mb-6 w-full max-w-full">
        {/* Previous Button */}
        {hasOverflow && (
          <button
            type="button"
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Previous categories"
            title="Scroll previous categories"
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-200 select-none ${canScrollLeft
              ? "bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
              : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed opacity-35"
              }`}
          >
            <ChevronLeft size={18} className="stroke-[2.25]" />
          </button>
        )}

        {/* Scrollable Category Chips Container */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto scroll-smooth py-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <button
            type="button"
            onClick={() => setSearchParams({})}
            data-category=""
            className={`vx-tab flex-shrink-0 ${!category ? "vx-tab-active" : "vx-tab-inactive"}`}
          >
            All
          </button>
          {shopCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSearchParams({ category: cat.slug })}
              data-category={cat.slug}
              className={`vx-tab flex-shrink-0 ${category === cat.slug ? "vx-tab-active" : "vx-tab-inactive"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Next Button */}
        {hasOverflow && (
          <button
            type="button"
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            aria-label="Next categories"
            title="Scroll next categories"
            className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all duration-200 select-none ${canScrollRight
              ? "bg-white hover:bg-gray-100 text-gray-800 border-gray-300 shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
              : "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed opacity-35"
              }`}
          >
            <ChevronRight size={18} className="stroke-[2.25]" />
          </button>
        )}
      </div>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-gray-400 text-lg">No products found.</p>
          <button
            onClick={() => setSearchParams({})}
            className="mt-4 text-sm text-volt-red underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
