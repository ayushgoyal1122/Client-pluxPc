import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleArrowRight } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext";
import ProductCarousel from "../ui/ProductCarousel";

const TABS = ["New Launches", "Personalisation"] as const;
type Tab = typeof TABS[number];

export default function HotPicksForYou() {
  const { getSection } = useStorefront();
  const [activeTab, setActiveTab] = useState<Tab>("New Launches");

  const products =
    activeTab === "New Launches"
      ? getSection("hotpicks")
      : getSection("personalisation");

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="vx-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="vx-section-title">
            Hot <span>Picks For You</span>
          </h2>
          <Link to="/products" className="vx-view-all">
            View All <CircleArrowRight size={16} />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`vx-tab ${activeTab === tab ? "vx-tab-active" : "vx-tab-inactive"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Carousel */}
        <ProductCarousel products={products} cardWidth="w-[195px] sm:w-[210px]" />
      </div>
    </section>
  );
}

