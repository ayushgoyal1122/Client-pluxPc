import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  Phone,
} from "lucide-react";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { getOrderById } from "../services/api";
import type { Order, TrackingEvent } from "../types";
import { formatPrice, handleImageError } from "../utils";

const STAGES = [
  { key: "confirmed", label: "Order Confirmed", step: 1 },
  { key: "processing", label: "Processing in Warehouse", step: 2 },
  { key: "shipped", label: "Shipped with Courier", step: 3 },
  { key: "out_for_delivery", label: "Out for Delivery", step: 4 },
  { key: "delivered", label: "Delivered", step: 5 },
];

function getStageStep(status: string): number {
  switch (status) {
    case "placed":
    case "confirmed":
      return 1;
    case "processing":
      return 2;
    case "shipped":
      return 3;
    case "out_for_delivery":
      return 4;
    case "delivered":
      return 5;
    default:
      return 1;
  }
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, token } = useCustomerAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname, message: "Please log in to track your order." },
      });
      return;
    }

    if (isAuthenticated && orderId) {
      fetchOrder();
    }
  }, [authLoading, isAuthenticated, orderId, navigate, location.pathname]);

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderById(orderId, token);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.message || "Could not retrieve order details.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order tracking details.");
    } finally {
      setLoading(false);
    }
  };

  const hasPersistedHistory = Boolean(
    order?.trackingHistory && order.trackingHistory.length > 0
  );

  // Reverse timeline events to show newest on top, with a safe verified fallback if needed
  // Placed unconditionally before any early returns to strictly follow React Rules of Hooks
  const timelineEvents: TrackingEvent[] = useMemo(() => {
    if (!order) return [];

    if (order.trackingHistory && order.trackingHistory.length > 0) {
      return [...order.trackingHistory].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    // Trustworthy fallback derived strictly from verifiable order record timestamps
    const fallback: TrackingEvent[] = [
      {
        status: "placed",
        timestamp: order.createdAt,
        description: "Order placed by customer",
        location: "",
        actor: "customer",
      },
    ];

    if (order.paymentStatus === "paid" || order.paidAt) {
      fallback.push({
        status: "confirmed",
        timestamp: order.paidAt || order.createdAt,
        description: "Payment authorized via Razorpay. Order confirmed.",
        location: "",
        actor: "system",
      });
    }

    if (order.orderStatus === "processing") {
      fallback.push({
        status: "processing",
        timestamp: order.updatedAt || order.paidAt || order.createdAt,
        description: "Order received and processing in warehouse.",
        location: "",
        actor: "system",
      });
    } else if (order.orderStatus === "shipped" && order.shipment?.shippedAt) {
      fallback.push({
        status: "shipped",
        timestamp: order.shipment.shippedAt,
        description: `Dispatched with ${order.shipment.courierName || "courier"}.`,
        location: "",
        actor: "admin",
      });
    } else if (order.orderStatus === "out_for_delivery") {
      fallback.push({
        status: "out_for_delivery",
        timestamp: order.updatedAt,
        description: "Package is out for delivery to destination address.",
        location: order.deliveryAddress?.city || "",
        actor: "admin",
      });
    } else if (order.orderStatus === "delivered" && order.shipment?.deliveredAt) {
      fallback.push({
        status: "delivered",
        timestamp: order.shipment.deliveredAt,
        description: "Package successfully delivered to recipient.",
        location: order.deliveryAddress?.city || "",
        actor: "admin",
      });
    } else if (order.orderStatus === "cancelled") {
      fallback.push({
        status: "cancelled",
        timestamp: order.updatedAt || order.createdAt,
        description: "Order cancelled.",
        location: "",
        actor: "system",
      });
    }

    return fallback.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [order]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-44" />
          <div className="h-10 bg-gray-200 rounded w-72" />
          <div className="h-64 bg-white rounded-3xl border border-gray-200 p-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-44 bg-white rounded-2xl border border-gray-200" />
            <div className="h-44 bg-white rounded-2xl border border-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50/60 py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white border border-gray-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-volt-red rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tracking Unavailable</h2>
          <p className="text-xs text-gray-500 mb-6">
            {error || "We could not find the requested order tracking information."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/orders"
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              My Orders
            </Link>
            <button
              onClick={fetchOrder}
              className="px-5 py-2.5 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = getStageStep(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";

  const formattedOrderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const estimatedDeliveryText = order.shipment?.estimatedDeliveryDate
    ? new Date(order.shipment.estimatedDeliveryDate).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/80">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Orders</span>
          </Link>
          <span className="text-xs text-gray-400 font-mono">Order Ref: {order.orderNumber}</span>
        </div>

        {/* Main Status Hero Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Live Shipment Tracking
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1 flex items-center gap-2">
                <span>Order #{order.orderNumber}</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <Calendar size={13} className="text-gray-400" />
                <span>Placed on {formattedOrderDate}</span>
              </p>
            </div>

            {/* Current Status Pill */}
            <div className="self-start sm:self-auto">
              {isCancelled ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  <XCircle size={15} />
                  <span>Order Cancelled</span>
                </div>
              ) : order.orderStatus === "delivered" ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 size={15} />
                  <span>Delivered Successfully</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-volt-red/10 border border-volt-red/30 text-volt-red text-xs font-bold">
                  <Truck size={15} className="animate-bounce" />
                  <span className="capitalize">{order.orderStatus.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cancelled Banner if applicable */}
          {isCancelled ? (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-bold">This order has been cancelled.</p>
              <p className="text-[11px] text-rose-700">
                If payment was verified, your refund is processed to the original payment method. For further assistance, contact PLUXPC support.
              </p>
            </div>
          ) : (
            <>
              {/* Horizontal Stepper Timeline (Desktop & Tablet) */}
              <div className="hidden md:block py-8">
                <div className="relative flex items-center justify-between">
                  {/* Background progress bar line */}
                  <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-0" />
                  <div
                    className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-volt-red transition-all duration-500 -z-0"
                    style={{
                      width: `${((currentStep - 1) / (STAGES.length - 1)) * 88}%`,
                    }}
                  />

                  {STAGES.map((s) => {
                    const isPassed = currentStep > s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.key} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                            isPassed
                              ? "bg-volt-red text-white"
                              : isCurrent
                              ? "bg-volt-red text-white ring-4 ring-red-100"
                              : "bg-white border-2 border-gray-200 text-gray-400"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={16} /> : s.step}
                        </div>
                        <span
                          className={`text-center text-[11px] font-bold mt-2 max-w-[100px] leading-tight ${
                            isCurrent
                              ? "text-volt-red"
                              : isPassed
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Stage Indicator */}
              <div className="md:hidden py-4 border-b border-gray-100">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
                  <span>Stage {currentStep} of 5</span>
                  <span className="text-volt-red capitalize">{order.orderStatus.replace(/_/g, " ")}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-volt-red h-full rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Courier & Dispatch Card */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                Courier Partner
              </span>
              {order.shipment?.courierName?.trim() ? (
                <>
                  <p className="font-bold text-gray-900">{order.shipment.courierName}</p>
                  {order.shipment.trackingNumber?.trim() ? (
                    <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                      Waybill: {order.shipment.trackingNumber}
                    </p>
                  ) : null}
                  {order.shipment.trackingUrl?.trim() && (
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-volt-red hover:underline mt-2"
                    >
                      <span>Track with Courier</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Courier will be assigned when your order ships.
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                Estimated Delivery
              </span>
              {estimatedDeliveryText ? (
                <>
                  <p className="font-bold text-emerald-700">{estimatedDeliveryText}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Estimated by courier partner</p>
                </>
              ) : (
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  Delivery estimate will be available once your order ships.
                </p>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                Payment Method
              </span>
              <p className="font-bold text-gray-900 capitalize">
                {order.paymentMethod} • {order.paymentStatus}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                {order.razorpayPaymentId || "Prepaid Verified"}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Details: Real Activity Log & Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left Column: Persisted Tracking History Timeline ── */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 tracking-tight pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>Tracking Activity Log</span>
                {!hasPersistedHistory && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Recorded History
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-400">
                {timelineEvents.length} {timelineEvents.length === 1 ? "update" : "updates"}
              </span>
            </h2>

            {timelineEvents.length === 0 ? (
              <p className="text-xs text-gray-500 py-6 text-center">
                Initial order updates will be recorded as processing progresses.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 pt-5 before:absolute before:left-2 before:top-6 before:bottom-3 before:w-0.5 before:bg-gray-100">
                {timelineEvents.map((event, idx) => {
                  const eventDate = new Date(event.timestamp).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isLatest = idx === 0;

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 border-white transition-all ${
                          isLatest ? "bg-volt-red ring-4 ring-red-100" : "bg-gray-300"
                        }`}
                      />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p
                            className={`text-xs font-bold capitalize ${
                              isLatest ? "text-volt-red" : "text-gray-900"
                            }`}
                          >
                            {event.status.replace(/_/g, " ")}
                          </p>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} />
                            <span>{eventDate}</span>
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {event.description}
                        </p>

                        {event.location && (
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 pt-0.5">
                            <MapPin size={11} className="text-gray-400" />
                            <span>Location: {event.location}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right Column: Delivery Address & Ordered Items ── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Address Snapshot */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm text-xs space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <MapPin size={16} className="text-volt-red" />
                <h3 className="text-sm font-bold text-gray-900">Destination Address</h3>
              </div>
              <p className="font-bold text-gray-900 text-sm">{order.deliveryAddress.fullName}</p>
              <p className="text-gray-600 leading-relaxed">{order.deliveryAddress.street}</p>
              <p className="text-gray-600">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}
              </p>
              <p className="text-gray-500 pt-1 flex items-center gap-1.5">
                <Phone size={12} className="text-gray-400" />
                <span>{order.deliveryAddress.phone}</span>
              </p>
            </div>

            {/* Items Summary */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Items in this Package</h3>
                <span className="text-xs font-semibold text-gray-500">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex items-center gap-3">
                    <img
                      src={it.imageUrl}
                      alt={it.name}
                      onError={(e) => handleImageError(e, it.name)}
                      className="w-11 h-11 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{it.name}</p>
                      <p className="text-[11px] text-gray-500">
                        Qty: {it.quantity} × {formatPrice(it.price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {formatPrice(it.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline text-xs">
                <span className="font-bold text-gray-700">Total Paid</span>
                <span className="text-base font-black text-volt-red">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
