import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { useCart } from "../hooks/useCart";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { fetchPlatformFeeConfig } from "../services/api";
import { formatPrice, handleImageError } from "../utils";
import type { PlatformFeeConfig } from "../types";

export default function CartPage() {
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    platformFee,
    loading: cartLoading,
    error,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [feeConfig, setFeeConfig] = useState<PlatformFeeConfig | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadFeeConfig = async () => {
      const res = await fetchPlatformFeeConfig();
      if (isMounted && res.success && res.settings) {
        setFeeConfig(res.settings);
      }
    };
    loadFeeConfig();

    const handleSync = () => {
      if (document.visibilityState === "visible") {
        loadFeeConfig();
      }
    };

    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
    };
  }, []);

  // Compute platform fee dynamically based on server-authoritative configuration
  const effectivePlatformFee = useMemo(() => {
    if (platformFee !== undefined && platformFee > 0) {
      return platformFee;
    }
    if (!feeConfig || !feeConfig.enabled || subtotal <= 0) {
      return 0;
    }
    const val = Number(feeConfig.feeValue) || 0;
    let fee = 0;
    if (feeConfig.feeType === "fixed") {
      fee = val;
    } else {
      fee = (subtotal * val) / 100;
      if (feeConfig.minFee && fee < Number(feeConfig.minFee)) {
        fee = Number(feeConfig.minFee);
      }
      if (feeConfig.maxFee && fee > Number(feeConfig.maxFee)) {
        fee = Number(feeConfig.maxFee);
      }
    }
    return Math.max(0, Math.round(fee * 100) / 100);
  }, [platformFee, feeConfig, subtotal]);

  const cartPayable = Math.max(0, subtotal + (shippingFee || 0) + effectivePlatformFee);

  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const handleQtyChange = async (productId: string, newQty: number) => {
    setBusyProductId(productId);
    await updateQuantity(productId, newQty);
    setBusyProductId(null);
  };

  const handleRemove = async (productId: string) => {
    setBusyProductId(productId);
    await removeFromCart(productId);
    setBusyProductId(null);
  };

  // 1. Guest state: not logged in
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="vx-container py-16 sm:py-24">
        <div className="max-w-md mx-auto text-center bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-volt-red flex items-center justify-center mx-auto mb-5 shadow-2xs">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Your Cart is Waiting
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Please log in with your customer account to view your saved items, synchronize your cart across devices, and complete checkout.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login?redirect=/cart"
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-sm font-bold shadow-md transition-all active:scale-[0.99]"
            >
              <LogIn size={16} />
              <span>Customer Login</span>
            </Link>
            <Link
              to="/products"
              className="py-3 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading state
  if (cartLoading && items.length === 0) {
    return (
      <div className="vx-container py-24 text-center">
        <div className="w-8 h-8 border-3 border-volt-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-500">Retrieving your shopping cart...</p>
      </div>
    );
  }

  // 3. Empty cart state
  if (items.length === 0) {
    return (
      <div className="vx-container py-16 sm:py-24">
        <div className="max-w-md mx-auto text-center bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Your Shopping Cart is Empty
          </h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Looks like you haven&apos;t added any audio or electronics to your cart yet. Explore our curated collections to find your next move.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-sm font-bold shadow-md transition-all active:scale-[0.99]"
          >
            <span>Explore Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vx-container py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your customer bag
          </p>
        </div>
        <Link
          to="/products"
          className="text-xs sm:text-sm font-semibold text-volt-red hover:underline self-start sm:self-auto flex items-center gap-1"
        >
          <span>Continue Shopping</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Items (Left) vs Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* ── Left Column: Cart Items ── */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {items.map((item) => {
              const p = item.product;
              const isBusy = busyProductId === p.id;

              return (
                <div
                  key={p.id}
                  className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-opacity ${
                    isBusy ? "opacity-50 pointer-events-none" : "opacity-100"
                  }`}
                >
                  {/* Image Tile */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F1F3F5] border border-gray-200/90 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => handleImageError(e, p.categoryLabel || p.name)}
                    />
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                      {p.categoryLabel || p.category}
                    </span>
                    <Link
                      to={`/products/${p.slug}`}
                      className="block font-bold text-sm sm:text-base text-gray-900 hover:text-volt-red truncate transition-colors"
                    >
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(p.price)}
                      </span>
                      {p.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(p.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Selector & Item Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50/70 p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(p.id, item.quantity - 1)}
                        disabled={isBusy}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-9 text-center font-bold text-xs text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(p.id, item.quantity + 1)}
                        disabled={isBusy || item.quantity >= (p.stockQuantity ?? 50)}
                        aria-label="Increase quantity"
                        className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right min-w-[80px]">
                      <span className="font-extrabold text-sm sm:text-base text-gray-900">
                        {formatPrice(p.price * item.quantity)}
                      </span>
                    </div>

                    {/* Trash Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id)}
                      disabled={isBusy}
                      title="Remove item"
                      aria-label={`Remove ${p.name}`}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantees Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white border border-gray-200/80 flex items-center gap-3 shadow-2xs">
              <Truck size={18} className="text-volt-red flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Free Shipping</p>
                <p className="text-[11px] text-gray-500">On all prepaid orders</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200/80 flex items-center gap-3 shadow-2xs">
              <ShieldCheck size={18} className="text-volt-red flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">1 Year Warranty</p>
                <p className="text-[11px] text-gray-500">Official brand cover</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-gray-200/80 flex items-center gap-3 shadow-2xs">
              <RotateCcw size={18} className="text-volt-red flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">7 Days Return</p>
                <p className="text-[11px] text-gray-500">Hassle-free replacement</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Order Summary ── */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight pb-3 border-b border-gray-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal ({itemCount})</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Standard Delivery</span>
                <span className="font-semibold text-emerald-600">
                  {shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee</span>
                <span className="font-semibold text-gray-900">
                  {effectivePlatformFee > 0 ? formatPrice(effectivePlatformFee) : "₹0.00"}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST / Taxes</span>
                <span className="font-medium text-gray-500">Included</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-between items-baseline">
              <div>
                <p className="text-base font-extrabold text-gray-900">Grand Total</p>
                <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                {formatPrice(cartPayable)}
              </span>
            </div>

            {/* Checkout Button */}
            <Link
              to="/checkout"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#E31E24] hover:bg-[#C9191E] text-white text-sm font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/products"
              className="block w-full text-center py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
