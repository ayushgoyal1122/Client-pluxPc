import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, MapPin, CreditCard, Truck } from "lucide-react";
import { getOrderById } from "../services/api";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import type { Order } from "../types";
import { formatPrice, handleImageError } from "../utils";

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useCustomerAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        const res = await getOrderById(orderId, token);
        if (res.success && res.order) {
          setOrder(res.order);
        } else {
          setError(res.message || "Could not retrieve order details.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order confirmation.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white border border-gray-200 rounded-2xl p-8 text-center animate-pulse">
          <div className="w-14 h-14 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-3" />
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-volt-red rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Confirmed</h2>
          <p className="text-xs text-gray-600 mb-6">
            Your transaction has been processed. If you need details, please check your customer account or support.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 py-10 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Main Success Card */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50/50">
            <CheckCircle2 size={36} />
          </div>

          <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full mb-3">
            Payment Verified & Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
            We have received your payment via Razorpay. Your order is now being processed by our warehouse.
          </p>

          {/* Key Reference Pills */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 mb-8">
            <div>
              <span className="text-gray-400 mr-1.5">Order ID:</span>
              <span className="font-bold text-gray-900 font-mono">{order.orderNumber}</span>
            </div>
            {order.razorpayPaymentId && (
              <>
                <span className="text-gray-300">•</span>
                <div>
                  <span className="text-gray-400 mr-1.5">Payment ID:</span>
                  <span className="font-bold text-gray-900 font-mono text-[11px]">{order.razorpayPaymentId}</span>
                </div>
              </>
            )}
            <span className="text-gray-300">•</span>
            <div>
              <span className="text-gray-400 mr-1.5">Amount Paid:</span>
              <span className="font-extrabold text-volt-red">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Ordered Products Breakdown */}
          <div className="text-left border-t border-gray-100 pt-6 mb-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Items in this Shipment
            </h3>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4 bg-white hover:bg-gray-50/50 transition-colors">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    onError={(e) => handleImageError(e, item.name)}
                    className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Quantity: <span className="font-semibold text-gray-700">{item.quantity}</span> × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Summary 2-Col */}
          <div className="text-left grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100 mb-8">
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-gray-900 font-bold mb-2">
                <MapPin size={14} className="text-volt-red" />
                <span>Shipping Address</span>
              </div>
              <p className="font-semibold text-gray-900">{order.deliveryAddress.fullName}</p>
              <p className="text-gray-600">{order.deliveryAddress.street}</p>
              <p className="text-gray-600">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}
              </p>
              <p className="text-gray-500 pt-1">Phone: {order.deliveryAddress.phone}</p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-900 font-bold mb-2">
                <CreditCard size={14} className="text-volt-red" />
                <span>Payment Summary</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Standard Delivery</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              {order.platformFee !== undefined && order.platformFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-gray-900">{formatPrice(order.platformFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-900 font-extrabold pt-2 border-t border-gray-200">
                <span>Total Paid</span>
                <span className="text-volt-red font-black text-sm">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/orders/${order._id}/track`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-volt-red hover:bg-[#C9191E] text-white text-xs font-bold transition-all shadow-md active:scale-[0.99]"
            >
              <Truck size={15} />
              <span>Track Your Order</span>
            </Link>
            <Link
              to="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
            >
              <span>Continue Shopping</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
