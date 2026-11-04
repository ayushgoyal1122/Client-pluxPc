import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Truck,
  CreditCard,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  Tag,
  CheckCircle2,
  X,
} from "lucide-react";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { useCart } from "../hooks/useCart";
import {
  createPaymentOrder,
  verifyPayment,
  validatePromoCode,
  fetchPlatformFeeConfig,
} from "../services/api";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { formatPrice, handleImageError } from "../utils";
import type { PlatformFeeConfig } from "../types";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, isAuthenticated, isLoading: authLoading, token } = useCustomerAuth();
  const { items, itemCount, subtotal, shippingFee, loading: cartLoading, refreshCart } = useCart();

  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Promo Code State
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    name: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    totalDiscount: number;
    newSubtotal: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Platform Fee Configuration
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

  // Computed discount, platform fee, and payable amount
  const promoDiscount = appliedPromo ? Math.min(appliedPromo.totalDiscount, subtotal) : 0;
  const eligibleSubtotal = Math.max(0, subtotal - promoDiscount);

  const effectivePlatformFee = useMemo(() => {
    if (!feeConfig || !feeConfig.enabled || eligibleSubtotal <= 0) {
      return 0;
    }
    const val = Number(feeConfig.feeValue) || 0;
    let fee = 0;
    if (feeConfig.feeType === "fixed") {
      fee = val;
    } else {
      fee = (eligibleSubtotal * val) / 100;
      if (feeConfig.minFee && fee < Number(feeConfig.minFee)) {
        fee = Number(feeConfig.minFee);
      }
      if (feeConfig.maxFee && fee > Number(feeConfig.maxFee)) {
        fee = Number(feeConfig.maxFee);
      }
    }
    return Math.max(0, Math.round(fee * 100) / 100);
  }, [feeConfig, eligibleSubtotal]);

  const finalPayable = Math.max(0, eligibleSubtotal + shippingFee + effectivePlatformFee);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoError(null);
    setPromoSuccess(null);
    setPromoLoading(true);

    try {
      const cartItemsPayload = items.map((item) => ({
        product: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const res = await validatePromoCode(promoInput.trim().toUpperCase(), cartItemsPayload, token);

      if (res.valid) {
        setAppliedPromo({
          code: res.code,
          name: res.name,
          discountType: res.discountType,
          discountValue: res.discountValue,
          totalDiscount: res.totalDiscount,
          newSubtotal: res.newSubtotal,
        });
        setPromoSuccess(res.message || `Promo code "${res.code}" applied successfully!`);
        setPromoInput("");
      } else {
        setPromoError(res.error || res.message || "Invalid or ineligible promo code.");
      }
    } catch (err: any) {
      setPromoError(err.message || "Failed to validate promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoSuccess(null);
    setPromoError(null);
  };

  // Pre-fill customer name and email once loaded
  useEffect(() => {
    if (customer?.name && !fullName) {
      setFullName(customer.name);
    }
    if (customer?.email && !contactEmail) {
      setContactEmail(customer.email);
    }
  }, [customer, fullName, contactEmail]);

  // Redirect guest users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: {
          from: location.pathname,
          message: "Please log in to proceed with your checkout.",
        },
      });
    }
  }, [authLoading, isAuthenticated, navigate, location.pathname]);

  // Pre-load Razorpay Checkout script in the background
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);

    // Form Validations
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    const cleanEmail = contactEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage("Please enter a valid order notification email address.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!street.trim()) {
      setErrorMessage("Please enter your delivery street address.");
      return;
    }
    if (!city.trim() || !stateName.trim() || !postalCode.trim()) {
      setErrorMessage("Please complete your City, State, and PIN code.");
      return;
    }
    if (cleanPhone.length > 15) {
      setErrorMessage("Please enter a valid phone number.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Add products before checking out.");
      return;
    }

    setProcessing(true);

    try {
      // 1. Ensure Razorpay Checkout script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMessage("Unable to load Razorpay payment gateway. Please check your internet connection and try again.");
        setProcessing(false);
        return;
      }

      // 2. Request backend order creation
      const res = await createPaymentOrder(
        {
          fullName: fullName.trim(),
          phone: cleanPhone,
          street: street.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
        },
        token,
        appliedPromo ? appliedPromo.code : undefined,
        cleanEmail
      );

      if (!res.success) {
        setErrorMessage(res.message || "Failed to initiate payment order.");
        setProcessing(false);
        return;
      }

      const { orderId, orderNumber, razorpayOrderId, amount, currency, keyId } = res;

      // Check if Key ID is configured
      if (!keyId || keyId === "rzp_test_placeholder") {
        setErrorMessage(
          "Razorpay Key ID is not configured on the server yet. Please add your RAZORPAY_KEY_ID in server/.env to complete checkout."
        );
        setProcessing(false);
        return;
      }

      // 3. Configure Razorpay Standard Checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "PLUXPC",
        description: `Order ${orderNumber}`,
        order_id: razorpayOrderId,
        notes: {
          orderNumber,
          orderId,
        },
        prefill: {
          name: fullName.trim(),
          email: cleanEmail,
          contact: cleanPhone,
        },
        theme: {
          color: "#E31E24", // PLUXPC brand red
        },
        modal: {
          backdropclose: false,
          escape: true,
          handleback: true,
          confirm_close: true,
          ondismiss: () => {
            console.log("[Razorpay Checkout] Modal dismissed or cancelled by customer");
            setProcessing(false);
            setStatusNotice("Payment window was closed. Your cart is preserved and you can retry when ready.");
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          console.log("[Razorpay Checkout] Payment authorized by gateway:", {
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature_received: !!response.razorpay_signature,
          });
          setStatusNotice("Payment authorized! Verifying transaction with PLUXPC server...");
          try {
            const verifyRes = await verifyPayment(
              {
                orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              token
            );

            if (verifyRes.success) {
              console.log("[Razorpay Checkout] Verification succeeded:", {
                orderId,
                orderNumber,
                paymentStatus: verifyRes.order?.paymentStatus,
              });
              await refreshCart();
              navigate(`/order-success/${orderId}`, { replace: true });
            } else {
              console.warn("[Razorpay Checkout] Verification failed:", verifyRes.message);
              setErrorMessage(verifyRes.message || "Payment verification failed. Please contact customer support.");
              setProcessing(false);
            }
          } catch (verifyErr: any) {
            console.error("[Razorpay Checkout] Verification network error:", verifyErr.message);
            setErrorMessage("Network error during payment verification. Please check your orders page.");
            setProcessing(false);
          }
        },
      };

      console.log("[Razorpay Checkout] Initializing checkout popup with order:", {
        orderId,
        orderNumber,
        razorpayOrderId,
        amount,
        currency,
      });

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", (failResponse: any) => {
        console.warn("[Razorpay Checkout] Payment failed event:", {
          code: failResponse?.error?.code,
          description: failResponse?.error?.description,
          source: failResponse?.error?.source,
          step: failResponse?.error?.step,
          reason: failResponse?.error?.reason,
        });
        setErrorMessage(failResponse?.error?.description || "Payment failed. Please try a different payment method.");
        setProcessing(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("[Checkout Error]:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setProcessing(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12">
        <div className="max-w-4xl mx-auto px-4 animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 bg-white rounded-2xl h-96 p-6 border border-gray-200" />
            <div className="md:col-span-5 bg-white rounded-2xl h-80 p-6 border border-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-volt-red rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={26} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-xs text-gray-500 mb-6">
            You do not have any items in your cart to proceed with checkout.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/80">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
              <ArrowLeft size={13} />
              <span>Back to Cart</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Checkout & Payment
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <Lock size={13} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Status & Error Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-volt-red flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-800">{errorMessage}</p>
          </div>
        )}

        {statusNotice && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-800">{statusNotice}</p>
          </div>
        )}

        {/* 2-Column Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── Left Column: Delivery Address Form ── */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handlePayNow} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <MapPin size={18} className="text-volt-red" />
                <h2 className="text-base font-bold text-gray-900">1. Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Recipient Full Name <span className="text-volt-red">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Order Notification Email <span className="text-volt-red">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. yourname@example.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Order confirmation, invoice, and tracking alerts will be delivered to this email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    10-Digit Mobile Number <span className="text-volt-red">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Postal Code (PIN) <span className="text-volt-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 560001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Street Address & Landmark <span className="text-volt-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="House/Flat No, Building, Street, Area"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    City <span className="text-volt-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    State <span className="text-volt-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Speed Card */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-100 text-emerald-700 flex items-center justify-center">
                    <Truck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Standard Express Delivery</p>
                    <p className="text-[11px] text-gray-500">Delivered within 2–4 business days</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  FREE
                </span>
              </div>
            </form>

            {/* Payment Method Info Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                <CreditCard size={18} className="text-volt-red" />
                <h2 className="text-base font-bold text-gray-900">2. Payment Method</h2>
              </div>
              <div className="p-4 rounded-xl border-2 border-volt-red bg-red-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-4 border-volt-red bg-white" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Razorpay Secure Checkout</p>
                    <p className="text-[11px] text-gray-500">
                      UPI, Credit/Debit Cards, NetBanking, and Wallets
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
                  Official Gateway
                </span>
              </div>

              {/* Sandbox Test Mode Guidance */}
              <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <AlertCircle size={15} className="text-blue-600 flex-shrink-0" />
                  <span>Razorpay Test Mode Instructions</span>
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  In sandbox test mode, real banking apps cannot scan QR codes. To advance the test payment:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 text-[11px] pl-1">
                  <li>
                    <strong>Card:</strong> Select <em>Card</em> & enter <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">4012 0000 0000 0002</code>, any expiry date & CVV <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">123</code>. Click <strong>Success</strong> on the test bank screen.
                  </li>
                  <li>
                    <strong>UPI:</strong> Switch from QR to <em>UPI ID</em> and enter <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono">success@razorpay</code>.
                  </li>
                  <li>
                    <strong>Netbanking:</strong> Select any bank (e.g., SBI, HDFC) and click <strong>Success</strong> on the simulated portal.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Right Column: Order Review & Pay CTA ── */}
          <div className="lg:col-span-5 sticky top-24 space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Order Summary</h2>
                <span className="text-xs text-gray-500 font-semibold">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
              </div>

              {/* Items scroll list */}
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center gap-3">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      onError={(e) => handleImageError(e, item.product.categoryLabel || item.product.name)}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-gray-500">Qty: {item.quantity} × {formatPrice(item.product.price)}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input & Status */}
              <div className="pt-3 border-t border-gray-100">
                {appliedPromo ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black font-mono text-emerald-900 tracking-wider">
                            {appliedPromo.code}
                          </span>
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            APPLIED
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          {appliedPromo.name} (Saved {formatPrice(promoDiscount)})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold p-1 rounded-lg hover:bg-emerald-100 transition-colors"
                      title="Remove promo code"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      Have a promo code?
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          placeholder="e.g. PLUXPC20"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs font-mono uppercase tracking-wider text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        {promoLoading ? "Applying..." : "Apply"}
                      </button>
                    </div>
                  </form>
                )}

                {promoError && (
                  <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={12} className="flex-shrink-0" />
                    <span>{promoError}</span>
                  </p>
                )}
                {promoSuccess && !appliedPromo && (
                  <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">{promoSuccess}</p>
                )}
              </div>

              {/* Calculations */}
              <div className="space-y-2.5 text-xs pt-3 border-t border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <span>Promo Discount</span>
                      <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                        ({appliedPromo.code})
                      </span>
                    </span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Charges</span>
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
                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-extrabold text-gray-900">Total Payable</span>
                    <p className="text-[10px] text-gray-400">All prices in INR</p>
                  </div>
                  <span className="text-xl font-black text-gray-900 tracking-tight">
                    {formatPrice(finalPayable)}
                  </span>
                </div>
              </div>

              {/* Pay Now Button */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-volt-red hover:bg-[#C9191E] disabled:bg-gray-400 text-white text-sm font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <Lock size={15} />
                <span>{processing ? "Connecting to Razorpay..." : `Pay ${formatPrice(finalPayable)} Now`}</span>
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Authoritative backend payment verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
