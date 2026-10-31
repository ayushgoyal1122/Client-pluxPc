import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleArrowRight } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext";
import ProductCarousel from "../ui/ProductCarousel";

const TABS = [
  { label: "All Deals", filter: null },
  { label: "True Wireless Earbuds", filter: "earbuds" },
  { label: "Smartwatches", filter: "smartwatches" },
  { label: "Speakers And Soundbars", filter: "speakers" },
  { label: "Neckbands And Headphones", filter: "headphones" },
] as const;

export default function TopDeals() {
  const { products: allProducts } = useStorefront();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const products = allProducts.filter((p) => {
    // Show products that have meaningful discounts
    if (!p.originalPrice) return false;
    const inSection =
      p.section?.includes("topdeals") ||
      p.section?.includes("exclusive") ||
      p.section?.includes("bestsellers");
    if (!inSection) return false;
    if (activeTab === null) return true;
    if (activeTab === "headphones") return p.category === "headphones" || p.category === "neckbands";
    if (activeTab === "speakers") return p.category === "speakers" || p.category === "soundbars";
    return p.category === activeTab;
  });

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="vx-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="vx-section-title">
            Top <span>Deals</span>
          </h2>
          <Link to="/deals" className="vx-view-all">
            View All <CircleArrowRight size={16} />
          </Link>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.filter)}
              className={`vx-tab ${activeTab === tab.filter ? "vx-tab-active" : "vx-tab-inactive"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product carousel */}
        {products.length > 0 ? (
          <ProductCarousel products={products} cardWidth="w-[195px] sm:w-[210px]" />
        ) : (
          <p className="text-gray-400 text-sm py-8 text-center">No deals in this category right now.</p>
        )}
      </div>
    </section>
  );
}

