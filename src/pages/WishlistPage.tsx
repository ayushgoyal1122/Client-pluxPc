import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Star,
  Check,
  AlertCircle,
  LogIn,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useWishlist } from "../hooks/useWishlist";
import { useCart } from "../hooks/useCart";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { formatPrice, discountPercent, handleImageError } from "../utils";
import type { Product } from "../types";

export default function WishlistPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, count, loading, error, removeFromWishlist, clearWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();

  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [addingAll, setAddingAll] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Handle single item add to cart
  const handleAddToCart = async (product: Product) => {
    if (!product.inStock) return;

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname + location.search,
          message: "Please log in to add items to your cart.",
        },
      });
      return;
    }

    setAddingId(product.id);
    const res = await addToCart(product, 1);
    setAddingId(null);

    if (res.success) {
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    }
  };

  // Move all available items to cart
  const handleAddAllToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname + location.search,
          message: "Please log in to add items to your cart.",
        },
      });
      return;
    }

    const available = items.filter((p) => p.inStock);
    if (available.length === 0) return;

    setAddingAll(true);
    for (const prod of available) {
      await addToCart(prod, 1);
    }
    setAddingAll(false);

    // Mark all as added temporarily
    const nextAdded: Record<string, boolean> = {};
    available.forEach((p) => {
      nextAdded[p.id] = true;
    });
    setAddedIds(nextAdded);
    setTimeout(() => {
      setAddedIds({});
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* ── Breadcrumbs ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="vx-container py-3.5">
          <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Link to="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Wishlist</span>
          </nav>
        </div>
      </div>

      <div className="vx-container py-8 sm:py-10">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
                My Wishlist
              </h1>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-volt-red">
                {count} {count === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1.5">
              Saved items you love. Move them to your cart or keep them for later.
            </p>
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={addingAll || items.every((p) => !p.inStock)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs active:scale-[0.99]"
              >
                <ShoppingBag size={16} />
                <span>{addingAll ? "Adding All..." : "Move All to Bag"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs sm:text-sm font-semibold transition-colors"
                title="Clear all items from wishlist"
              >
                <Trash2 size={15} />
                <span className="hidden xs:inline">Clear Wishlist</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Guest Sync Banner ── */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-volt-red text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">
                  Sync your wishlist across all your devices
                </p>
                <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
                  Sign in or create an account to save your favorite tech gear permanently.
                </p>
              </div>
            </div>
            <Link
              to="/login?redirect=/wishlist"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-volt-red text-white text-xs font-bold hover:bg-red-600 transition-colors shadow-2xs flex-shrink-0"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </Link>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => refreshWishlist()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline"
            >
              <RefreshCw size={13} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* ── Loading Skeleton State ── */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col"
              >
                <div className="aspect-square bg-gray-200 rounded-xl mb-4 w-full" />
                <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
                <div className="h-10 w-full bg-gray-200 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* ── Empty State ── */
          <div className="max-w-md mx-auto text-center bg-white border border-gray-200/80 rounded-3xl p-8 sm:p-12 shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-volt-red flex items-center justify-center mx-auto mb-5 shadow-2xs">
              <Heart size={30} className="stroke-[1.75]" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-950 tracking-tight mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Explore our industry-leading wireless earbuds, smartwatches, speakers, and accessories to find something you love.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-sm font-bold shadow-md transition-all active:scale-[0.99]"
              >
                <span>Explore Products</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          /* ── Active Wishlist Items Grid ── */
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
            {items.map((product) => {
              const discount = product.originalPrice
                ? discountPercent(product.originalPrice, product.price)
                : null;
              const isAdded = addedIds[product.id];
              const isAdding = addingId === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col group relative"
                >
                  {/* ── Image & Badges ── */}
                  <div className="relative aspect-square bg-[#F1F3F5] overflow-hidden">
                    <Link to={`/products/${product.slug}`} className="block w-full h-full">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => handleImageError(e, product.name)}
                      />
                    </Link>

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.inStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500 text-white shadow-2xs">
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-2xs">
                          Out of Stock
                        </span>
                      )}

                      {/* Feature or Badge Tag */}
                      {product.featureTag && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-900/80 backdrop-blur-xs text-white">
                          {product.featureTag}
                        </span>
                      )}
                    </div>

                    {/* Quick Remove Button (Filled Heart) */}
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product.id)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      title="Remove from wishlist"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 shadow-sm flex items-center justify-center transition-all hover:scale-110 z-10"
                    >
                      <Heart size={16} className="fill-red-500 stroke-red-500" />
                    </button>
                  </div>

                  {/* ── Content ── */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    {/* Category */}
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      {product.categoryLabel || product.category}
                    </p>

                    {/* Title */}
                    <Link
                      to={`/products/${product.slug}`}
                      className="text-sm font-bold text-gray-900 hover:text-volt-red line-clamp-2 leading-snug mb-2 transition-colors"
                    >
                      {product.name}
                    </Link>

                    {/* Rating */}
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span className="font-bold text-gray-900">{product.rating}</span>
                        {product.reviewCount > 0 && (
                          <span className="text-gray-600">
                            ({product.reviewCount.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price Row */}
                    <div className="flex items-baseline gap-2 mt-auto mb-4 flex-wrap">
                      <span className="text-lg font-black text-gray-950">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-600 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                      {discount && (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          {discount}% OFF
                        </span>
                      )}
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock || isAdding}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all duration-200 ${
                          !product.inStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            : isAdded
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-950 text-white hover:bg-gray-800 active:scale-[0.98]"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={15} />
                            <span>Added!</span>
                          </>
                        ) : isAdding ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={15} />
                            <span>{product.inStock ? "Move to Bag" : "Out of Stock"}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFromWishlist(product.id)}
                        title="Remove from wishlist"
                        aria-label="Remove"
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Clear Confirmation Modal ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-950 mb-1.5">Clear Wishlist?</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
              Are you sure you want to remove all {count} {count === 1 ? "item" : "items"} from your wishlist? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearWishlist();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

