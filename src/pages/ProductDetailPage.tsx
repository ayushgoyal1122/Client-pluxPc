import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Heart,
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  Zap,
} from "lucide-react";
import type { Product } from "../types";
import { fetchProductBySlug } from "../services/api";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useStorefront } from "../context/StorefrontContext";
import { formatPrice, discountPercent, clamp } from "../utils";
import ProductCard from "../components/ui/ProductCard";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductStorytellingPosters from "../components/product/ProductStorytellingPosters";
import ProductSpecificStory from "../components/product/ProductSpecificStory";
import { resolveProductMedia } from "../utils/productMediaResolver";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated } = useCustomerAuth();
  const { toggle, isWishlisted } = useWishlist();
  const { products: storefrontProducts } = useStorefront();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);

  // Scroll to top and load product on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    let isMounted = true;

    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      setSelectedImage("");

      try {
        const res = await fetchProductBySlug(slug);
        if (isMounted) {
          if (res.success && res.data) {
            setProduct(res.data);
            setSelectedImage(res.data.imageUrl);
            setQuantity(1);
          } else {
            setError("Product not found");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load product details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Synchronize product state automatically when storefront catalog updates
  useEffect(() => {
    if (!slug || !storefrontProducts || storefrontProducts.length === 0) return;
    const matching = storefrontProducts.find((p) => p.slug === slug || p.id === slug);
    if (matching) {
      setProduct((prev) => {
        if (!prev) return matching;
        const prevPromo = JSON.stringify(prev.activePromotion);
        const nextPromo = JSON.stringify(matching.activePromotion);
        if (
          prev.price !== matching.price ||
          prev.originalPrice !== matching.originalPrice ||
          prevPromo !== nextPromo
        ) {
          return { ...prev, ...matching };
        }
        return prev;
      });
    }
  }, [storefrontProducts, slug]);

  // Silently refresh product details on tab focus, visibility change, or background interval
  useEffect(() => {
    if (!slug) return;

    const refreshSilently = async () => {
      try {
        const res = await fetchProductBySlug(slug);
        if (res.success && res.data) {
          setProduct((prev) => (prev ? { ...prev, ...res.data! } : res.data));
        }
      } catch {
        // silent
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        refreshSilently();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    const pollId = setInterval(handleFocus, 3500);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(pollId);
    };
  }, [slug]);

  // Resolved gallery images and promotional posters for any product
  const { galleryImages, promotionalPosters } = useMemo(() => {
    if (!product) return { galleryImages: [], promotionalPosters: [] };
    return resolveProductMedia(product);
  }, [product]);

  // Related products from the same category
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    let list = storefrontProducts.filter(
      (p) => p.category === product.category && p.slug !== product.slug && p.id !== product.id
    );
    if (list.length < 4) {
      const complementary = storefrontProducts.filter(
        (p) => p.slug !== product.slug && p.id !== product.id && !list.some((l) => l.id === p.id)
      );
      list = [...list, ...complementary];
    }
    return list.slice(0, 4);
  }, [product, storefrontProducts]);

  const maxStock = product?.stockQuantity ? Math.min(product.stockQuantity, 10) : 10;
  const inStock = product ? (product.inStock !== false && (product.stockQuantity === undefined || product.stockQuantity > 0)) : false;
  const wishlisted = product ? isWishlisted(product.id) : false;

  const discount = product?.originalPrice
    ? discountPercent(product.originalPrice, product.price)
    : null;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => clamp(prev + delta, 1, maxStock));
  };

  const handleAddToCart = async () => {
    if (!product || !inStock) return;

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: location.pathname + location.search,
          message: "Please log in to add items to your cart.",
        },
      });
      return;
    }

    const res = await addToCart(product, quantity);
    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    toggle(product);
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="vx-container py-8 sm:py-12 animate-pulse">
        <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-gray-200 rounded-2xl aspect-square w-full" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-5 w-48 bg-gray-200 rounded" />
            <div className="h-10 w-40 bg-gray-200 rounded" />
            <div className="h-12 w-full bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (error || !product) {
    return (
      <div className="vx-container py-16 sm:py-24 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Zap size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
          The product you are looking for may have been retired, renamed, or is temporarily unavailable.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            to="/products"
            className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="vx-container py-6 sm:py-8">
        {/* ── Breadcrumb Navigation ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
          <Link to="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-gray-900 transition-colors uppercase font-medium"
          >
            {product.categoryLabel}
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-semibold truncate max-w-[240px] sm:max-w-md">
            {product.name}
          </span>
        </nav>

        {/* ── Main Product Section (2-Column Grid) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* ── Left Column: Media Gallery (Noise-Inspired Vertical Thumbnails & Primary View) ── */}
          <div className="lg:col-span-6 w-full">
            <ProductImageGallery
              images={galleryImages}
              selectedImage={selectedImage || product.imageUrl}
              onSelectImage={setSelectedImage}
              productName={product.name}
              categoryLabel={product.categoryLabel}
              isWishlisted={wishlisted}
              onWishlistToggle={handleWishlistToggle}
              activePromotion={product.activePromotion}
              badge={product.badge}
              badgeIcon={product.badgeIcon}
              featureTag={product.featureTag}
            />
          </div>

          {/* ── Right Column: Product Info & Purchasing ── */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            {/* Category Pill */}
            <div className="mb-2">
              <Link
                to={`/products?category=${product.category}`}
                className="inline-block text-xs uppercase tracking-wider font-bold text-volt-red bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
              >
                {product.categoryLabel}
              </Link>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
              {product.name}
            </h1>

            {/* Rating & Stock Status Row */}
            <div className="flex items-center gap-4 flex-wrap mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold">{product.rating}</span>
                <span className="text-xs text-amber-700">({product.reviewCount.toLocaleString()} reviews)</span>
              </div>

              {/* Stock Badge */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {inStock ? (
                  <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    In Stock (Ships in 24 hrs)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Currently Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Pricing Area */}
            <div className="mb-6">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {discount && (
                  <span className="text-sm font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-md">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Inclusive of all taxes. Free shipping on all prepaid orders.
              </p>
            </div>

            {/* Active Promotional Offer Banner */}
            {product.activePromotion && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 shadow-2xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-volt-red text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-volt-red">Special Offer</span>
                    {product.activePromotion.code && (
                      <span className="text-[11px] font-mono font-bold bg-white text-gray-900 px-2 py-0.5 rounded border border-red-200 shadow-2xs">
                        CODE: {product.activePromotion.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    {product.activePromotion.badgeText || (product.activePromotion.discountType === 'percentage' ? `${product.activePromotion.discountValue}% Instant Discount` : `Flat ₹${product.activePromotion.discountValue} Off`)}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-green-700 font-semibold ml-1">
                        (You save {formatPrice(product.originalPrice - product.price)})
                      </span>
                    )}
                  </p>
                  {product.activePromotion.endDate && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Limited time offer valid till {new Date(product.activePromotion.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Bag CTA */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1 || !inStock}
                    className="p-2.5 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-1 text-sm font-bold text-gray-900 select-none min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxStock || !inStock}
                    className="p-2.5 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {product.stockQuantity && product.stockQuantity <= 5 && inStock && (
                  <span className="text-xs font-semibold text-amber-600">
                    Only {product.stockQuantity} left!
                  </span>
                )}
              </div>

              {/* Add to Bag Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold shadow-md transition-all duration-200 ${
                    !inStock
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                      : added
                      ? "bg-green-600 text-white hover:bg-green-700 scale-[0.99]"
                      : "bg-gray-950 text-white hover:bg-gray-800 active:scale-[0.98]"
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={18} className="animate-bounce" />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>{inStock ? "Add to Bag" : "Out of Stock"}</span>
                    </>
                  )}
                </button>

                {/* Secondary Wishlist Button for quick tap */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  aria-label="Save to Wishlist"
                  className={`p-3.5 rounded-xl border transition-colors flex items-center justify-center ${
                    wishlisted
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Heart size={20} className={wishlisted ? "fill-red-500" : ""} />
                </button>
              </div>
            </div>

            {/* Trust Badges Row */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-volt-red flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">1-Year Warranty</p>
                  <p className="text-[11px] text-gray-500">Official Brand Coverage</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Free Express Delivery</p>
                  <p className="text-[11px] text-gray-500">Fast 24-hr Dispatch</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">7-Day Replacement</p>
                  <p className="text-[11px] text-gray-500">Hassle-Free Returns</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">100% Genuine</p>
                  <p className="text-[11px] text-gray-500">Direct From PLUXPC</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Same-Product Promotional Posters Storytelling Section (Noise-Inspired) ── */}
        <ProductStorytellingPosters
          productName={product.name}
          categoryLabel={product.categoryLabel}
          posters={promotionalPosters}
        />

        {/* ── Strict Same-Product Deep Dive: Specs, Features, Overview, Box, Compatibility ── */}
        <ProductSpecificStory product={product} />

        {/* ── Related / Recommended Products Section ── */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Related Products
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Handpicked alternatives in {product.categoryLabel}
                </p>
              </div>
              <Link
                to={`/products?category=${product.category}`}
                className="text-xs font-bold text-volt-red hover:underline flex items-center gap-1"
              >
                View all in {product.categoryLabel} <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

