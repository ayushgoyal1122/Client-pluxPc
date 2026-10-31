import { Link } from "react-router-dom";
import { CircleArrowRight } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext";
import { handleImageError } from "../../utils";

export default function ShopByCategories() {
  const { categories: shopCategories } = useStorefront();
  return (
    <section className="py-8 border-t border-gray-100">
      <div className="vx-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="vx-section-title">
            Shop by <span>Categories</span>
          </h2>
          <Link to="/categories" className="vx-view-all">
            View All <CircleArrowRight size={16} />
          </Link>
        </div>

        {/* Horizontal scrolling category row */}
        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {shopCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-3 flex-shrink-0 group"
            >
              {/* Circle image like boAt reference */}
              <div className="w-[90px] h-[90px] rounded-full bg-gray-100 overflow-hidden flex items-center justify-center
                              border border-gray-200 group-hover:border-volt-red transition-colors duration-200">
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => handleImageError(e, cat.name)}
                />
              </div>
              <span className="text-[12px] font-semibold text-gray-700 text-center leading-tight max-w-[90px] group-hover:text-volt-red transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

