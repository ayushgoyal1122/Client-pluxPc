import { Link } from "react-router-dom";
import { CircleArrowRight } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext";
import ProductCarousel from "../ui/ProductCarousel";

export default function ExclusiveOffers() {
  const { getSection } = useStorefront();
  const products = getSection("exclusive");

  return (
    <section className="py-8">
      <div className="vx-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="vx-section-title">
            Exclusive <span>Offers</span>
          </h2>
          <Link to="/products" className="vx-view-all">
            View All <CircleArrowRight size={16} />
          </Link>
        </div>

        {/* Carousel — 6 cards visible on desktop */}
        <ProductCarousel products={products} cardWidth="w-[195px] sm:w-[210px]" />
      </div>
    </section>
  );
}

