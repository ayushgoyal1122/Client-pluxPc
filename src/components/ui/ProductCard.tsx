import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Star, ShoppingBag } from "lucide-react";
import type { Product } from "../../types";
import { formatPrice, discountPercent, handleImageError } from "../../utils";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import { useCustomerAuth } from "../../context/CustomerAuthContext";

interface ProductCardProps {
  product: Product;
  /** compact = narrower card for dense grids */
  compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [added, setAdded] = useState(false);

  const discount = product.originalPrice
    ? discountPercent(product.originalPrice, product.price)
    : null;

  const wishlisted = isWishlisted(product.id);
  const hasFeatureStrip = Boolean(product.featureTag);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname + location.search,
          message: "Please log in to add items to your cart.",
        },
      });
      return;
    }

    const res = await addToCart(product, 1);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  return (
    <Link to={`/products/${product.slug}`} className="vx-card group block flex-shrink-0 w-full">
      {/* ── Image area ── */}
      <div
        className={`relative overflow-hidden bg-[#F1F3F5] flex items-center justify-center ${
          compact ? "aspect-square" : "aspect-[4/3.5]"
        }`}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105 ${
            hasFeatureStrip ? "p-2.5 pb-7 sm:p-3 sm:pb-8" : "p-2.5 sm:p-3"
          }`}
          loading="lazy"
          onError={(e) => handleImageError(e, product.categoryLabel || product.name)}
        />

        {/* Badge */}
        {product.activePromotion ? (
          <div className="absolute top-2 left-2 z-10 bg-volt-red text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
            <span>⚡</span>
            <span>{product.activePromotion.badgeText || (product.activePromotion.discountType === 'percentage' ? `${product.activePromotion.discountValue}% OFF` : `₹${product.activePromotion.discountValue} OFF`)}</span>
          </div>
        ) : product.badge ? (
          <div className="vx-badge">
            {product.badgeIcon && <span>{product.badgeIcon}</span>}
            <span>{product.badge}</span>
          </div>
        ) : null}

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          aria-label="Wishlist"
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm
                     hover:bg-white transition-colors"
        >
          <Heart
            size={14}
            className={wishlisted ? "text-red-500 fill-red-500" : "text-gray-500"}
          />
        </button>

        {/* Feature strip */}
        {product.featureTag && (
          <div className="vx-feature-strip">
            <span>{product.featureTag}</span>
            <div className="flex items-center gap-0.5 text-gray-700">
              <Star size={11} fill="currentColor" />
              <span className="text-[11px] font-bold">{product.rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Info area ── */}
      <div className="p-3 pb-3.5">
        <p className="text-[11px] text-gray-500 mb-0.5 uppercase tracking-wide truncate">{product.categoryLabel}</p>
        <h3 className="text-[13px] font-semibold text-gray-900 leading-snug mb-1.5 line-clamp-2">{product.name}</h3>

        {/* Pricing row */}
        <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
          <span className="text-[15px] font-bold text-gray-900">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[12px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
          {product.activePromotion?.code ? (
            <span className="text-[10px] font-bold text-volt-red bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {product.activePromotion.code}
            </span>
          ) : discount ? (
            <span className="text-[11px] font-semibold text-green-700">{discount}% off</span>
          ) : null}
        </div>

        {/* Add to cart */}
        <div className="flex items-center justify-end mt-2">
          <button
            onClick={handleAdd}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-all duration-150
              ${added ? "bg-green-500 text-white" : "bg-gray-900 text-white hover:bg-gray-700"}`}
          >
            <ShoppingBag size={11} />
            {added ? "Added!" : "Add"}
          </button>
        </div>
      </div>
    </Link>
  );
}

