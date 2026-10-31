// ─── API Service Layer ────────────────────────────────────────────────────────
// Connects to the Node/Express/MongoDB backend with safe fallback
// to static mock data if the backend is offline.

import type { Product, Category, ApiResponse } from "../types";
import { allProducts, shopCategories } from "../data/products";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function authHeaders(token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeToken = token || localStorage.getItem("voltix_admin_token");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

// ─────────────────────────────────────────────────────────────────────────────
// STOREFRONT API (Public)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchProducts(
  category?: string,
  section?: string,
  q?: string
): Promise<ApiResponse<Product[]>> {
  try {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (section) params.append("section", section);
    if (q) params.append("q", q);

    params.append("_t", Date.now().toString());
    const url = `${BASE_URL}/api/products${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return { success: true, data: data.data };
      }
    }
  } catch (err) {
    console.warn("[PLUXPC API] Backend unreachable, falling back to mock data:", err);
  }

  // Graceful fallback to local mock data
  let list = [...allProducts];
  if (category) list = list.filter((p) => p.category === category);
  if (section) list = list.filter((p) => p.section?.includes(section));
  if (q) {
    const query = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.categoryLabel.toLowerCase().includes(query)
    );
  }

  return { success: true, data: list };
}

export async function fetchProductBySlug(slug: string): Promise<ApiResponse<Product | null>> {
  try {
    const res = await fetch(`${BASE_URL}/api/products/${slug}?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, data: data.data };
      }
    }
  } catch (err) {
    console.warn("[PLUXPC API] Product lookup fallback:", err);
  }

  const found = allProducts.find((p) => p.slug === slug) ?? null;
  return { success: !!found, data: found };
}

export async function fetchCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const res = await fetch(`${BASE_URL}/api/categories`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return { success: true, data: data.data };
      }
    }
  } catch (err) {
    console.warn("[PLUXPC API] Categories lookup fallback:", err);
  }

  return { success: true, data: shopCategories };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API (Protected)
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminAuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function adminLogin(email: string, password: string): Promise<AdminAuthResponse> {
  const res = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function adminGetMe(token?: string) {
  const res = await fetch(`${BASE_URL}/api/admin/auth/me`, {
    headers: authHeaders(token),
  });
  return res.json();
}

export async function adminGetDashboard(token?: string) {
  const res = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: authHeaders(token),
  });
  return res.json();
}

// Admin Products CRUD
export async function adminGetProducts(params?: { q?: string; category?: string; inStock?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${BASE_URL}/api/admin/products${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function adminGetProductById(id: string) {
  const res = await fetch(`${BASE_URL}/api/admin/products/${id}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function adminCreateProduct(data: Partial<Product>) {
  const res = await fetch(`${BASE_URL}/api/admin/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminUpdateProduct(id: string, data: Partial<Product>) {
  const res = await fetch(`${BASE_URL}/api/admin/products/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminDeleteProduct(id: string) {
  const res = await fetch(`${BASE_URL}/api/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}

// Admin Categories CRUD
export async function adminGetCategories(params?: { q?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${BASE_URL}/api/admin/categories${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function adminCreateCategory(data: { name: string; slug?: string; imageUrl: string; description?: string }) {
  const res = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminUpdateCategory(id: string, data: Partial<Category>) {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function adminDeleteCategory(id: string) {
  const res = await fetch(`${BASE_URL}/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER AUTH & SHOPPING CART API
// ─────────────────────────────────────────────────────────────────────────────

export const CUSTOMER_TOKEN_KEY = "voltix_customer_token";

export function getCustomerToken(): string | null {
  try {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCustomerToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function customerHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const activeToken = token || getCustomerToken();
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

export async function customerRegister(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function customerLogin(credentials: { email: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
}

export async function customerGetProfile(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function customerLogout() {
  try {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: customerHeaders(),
    });
  } catch {
    // ignore
  } finally {
    setCustomerToken(null);
  }
}

export async function customerGetCart(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/cart`, {
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function customerAddToCart(productId: string, quantity = 1, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/cart/items`, {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ productId, quantity }),
  });
  return res.json();
}

export async function customerUpdateCartItem(productId: string, quantity: number, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/cart/items/${productId}`, {
    method: "PATCH",
    headers: customerHeaders(token),
    body: JSON.stringify({ quantity }),
  });
  return res.json();
}

export async function customerRemoveCartItem(productId: string, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/cart/items/${productId}`, {
    method: "DELETE",
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function customerClearCart(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/cart`, {
    method: "DELETE",
    headers: customerHeaders(token),
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// WISHLIST API (Customer / Guest)
// ─────────────────────────────────────────────────────────────────────────────

export async function customerGetWishlist(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/wishlist`, {
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function customerAddToWishlist(productId: string, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/wishlist/items`, {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ productId }),
  });
  return res.json();
}

export async function customerRemoveFromWishlist(productId: string, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/wishlist/items/${productId}`, {
    method: "DELETE",
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function customerClearWishlist(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/wishlist`, {
    method: "DELETE",
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function customerMergeWishlist(
  items: Array<{ productId: string } | string>,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/wishlist/merge`, {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ items }),
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS & ORDERS API
// ─────────────────────────────────────────────────────────────────────────────

export async function getRazorpayConfig() {
  const res = await fetch(`${BASE_URL}/api/payments/config`);
  return res.json();
}

export async function createPaymentOrder(
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
  },
  token?: string | null,
  promoCode?: string
) {
  const res = await fetch(`${BASE_URL}/api/payments/create-order`, {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ deliveryAddress, promoCode }),
  });
  return res.json();
}

export async function validatePromoCode(
  code: string,
  items: Array<{ product: string; quantity: number; price?: number }>,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/promotions/validate`, {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ code, items }),
  });
  return res.json();
}

export async function fetchActivePromotions() {
  try {
    const res = await fetch(`${BASE_URL}/api/promotions/active?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[PLUXPC API] Active promotions unreachable:", err);
  }
  return { success: false, promotions: [] };
}

export async function fetchPlatformFeeConfig() {
  try {
    const res = await fetch(`${BASE_URL}/api/platform-fee/config?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[PLUXPC API] Platform fee config unreachable:", err);
  }
  return { success: false, settings: { enabled: false, feeType: "fixed", feeValue: 0 } };
}

export async function calculatePlatformFeeQuote(subtotal: number) {
  try {
    const res = await fetch(`${BASE_URL}/api/platform-fee/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[PLUXPC API] Platform fee quote unreachable:", err);
  }
  return { success: false, platformFee: 0 };
}

export async function verifyPayment(
  data: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  },
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getCustomerOrders(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/orders/my-orders`, {
    headers: customerHeaders(token),
  });
  return res.json();
}

export async function getOrderById(orderId: string, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    headers: customerHeaders(token),
  });
  return res.json();
}

export { BASE_URL };
