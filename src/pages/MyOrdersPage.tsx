import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  Truck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShoppingBag,
  MapPin,
  Calendar,
} from "lucide-react";
import { useCustomerAuth } from "../context/CustomerAuthContext";
import { getCustomerOrders } from "../services/api";
import type { Order } from "../types";
import { formatPrice, handleImageError } from "../utils";

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, token } = useCustomerAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname, message: "Please log in to view your orders." },
      });
      return;
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [authLoading, isAuthenticated, navigate, location.pathname]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomerOrders(token);
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setError(res.message || "Failed to load orders.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading orders.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} />
            <span>Delivered</span>
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Truck size={13} />
            <span>Out for Delivery</span>
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck size={13} />
            <span>Shipped</span>
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={13} />
            <span>Processing</span>
          </span>
        );
      case "confirmed":
      case "placed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Package size={13} />
            <span>Order Confirmed</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={13} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100/70 text-emerald-800">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-amber-100/70 text-amber-800">
            Payment Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-rose-100/70 text-rose-800">
            Payment Failed
          </span>
        );
      case "refunded":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide bg-gray-100 text-gray-700">
            Refunded
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-80" />
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-gray-200 p-6" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200/80">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                My Orders
              </h1>
              <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-gray-200">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Review and track all your past and active PLUXPC orders.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <ShoppingBag size={14} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-volt-red flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-900 mb-1">Failed to load orders</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="text-xs font-bold text-red-900 underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !error && (
          <div className="bg-white border border-gray-200 rounded-3xl p-10 sm:p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <Package size={30} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No orders placed yet</h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
              When you place orders on PLUXPC, your order status, invoice, and real-time shipment tracking will appear here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 transition-colors shadow-sm"
            >
              <span>Explore Latest Products</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const totalItemQuantity = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={order._id}
                className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-gray-300 transition-all space-y-4"
              >
                {/* Order Card Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs">
                      <Package size={17} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-gray-900">
                          {order.orderNumber}
                        </span>
                        {getPaymentBadge(order.paymentStatus)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                        <Calendar size={11} />
                        <span>Ordered on {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.orderStatus)}</div>
                </div>

                {/* Items Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-8 space-y-2">
                    <div className="flex items-center gap-3 overflow-x-auto py-1">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            onError={(e) => handleImageError(e, item.name)}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0 bg-gray-50"
                          />
                          <div className="max-w-[140px] truncate text-left">
                            <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <span className="text-[11px] text-gray-400">Total Amount</span>
                    <span className="text-base font-black text-gray-900 tracking-tight">
                      {formatPrice(order.total)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {totalItemQuantity} {totalItemQuantity === 1 ? "item" : "items"}
                    </span>
                  </div>
                </div>

                {/* Destination & Actions Bar */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                    <MapPin size={13} className="text-volt-red flex-shrink-0" />
                    <span>
                      Shipping to: <strong className="text-gray-800">{order.deliveryAddress.fullName}</strong> ({order.deliveryAddress.city})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      to={`/order-success/${order._id}`}
                      className="flex-1 sm:flex-initial text-center px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      View Summary
                    </Link>
                    <Link
                      to={`/orders/${order._id}/track`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-volt-red hover:bg-[#C9191E] text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                    >
                      <Truck size={14} />
                      <span>Track Order</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
