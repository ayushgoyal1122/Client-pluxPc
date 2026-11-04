// ─── API Service Layer ────────────────────────────────────────────────────────
// Connects to the Node/Express/MongoDB backend with safe fallback
// to static mock data if the backend is offline.

import type { Product, Category, ApiResponse, LegalPage } from "../types";
import { allProducts, shopCategories } from "../data/products";

export const DEFAULT_PRODUCTION_API_URL = "https://pluxpc-api.onrender.com";

/**
 * Resolves the backend API base URL with safe defaults:
 * - If VITE_API_URL is configured (e.g. via Vercel env), use it (trimmed, without trailing slash)
 * - In production mode (Vercel builds), fall back to the live Render backend rather than an empty string
 * - In development mode, fall back to "" to leverage Vite's local dev proxy (/api -> localhost:5000)
 */
export function resolveBaseUrl(): string {
  const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || {};
  const processEnv = (typeof globalThis !== "undefined" && (globalThis as any).process?.env) || {};
  const envUrl = (env.VITE_API_URL || processEnv.VITE_API_URL || "").trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }
  if (env.DEV) {
    return "";
  }
  return DEFAULT_PRODUCTION_API_URL;
}

const BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Safely parses the response body without throwing unhandled SyntaxErrors on empty or HTML responses.
 */
async function parseResponse<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
  }

  if (!res.ok) {
    // If backend provided a structured error object with a message, preserve it
    if (data && typeof data === "object" && typeof data.message === "string") {
      return {
        success: false,
        ...data,
      } as T;
    }

    let detail = "Server request failed.";
    if (res.status === 405) {
      detail = "Method Not Allowed (405). The request was sent to a static host or invalid route.";
    } else if (res.status === 404) {
      detail = "Endpoint Not Found (404). Please verify backend URL.";
    } else if (res.status === 401 || res.status === 403) {
      detail = "Authentication failed or access denied.";
    } else if (res.status === 502 || res.status === 503) {
      detail = "Backend server is waking up (cold start). Please retry in a few moments.";
    }

    const message = data?.message || data?.error || detail;
    throw new ApiError(message, res.status, data);
  }

  if (data === null) {
    return { success: true } as T;
  }

  return data as T;
}

/**
 * Centralized fetch wrapper ensuring:
 * - Proper URL resolution with BASE_URL
 * - Network & CORS failure detection
 * - Safe response parsing
 */
export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, options);
    return await parseResponse<T>(res);
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }

    // Network or CORS failure
    if (
      err.name === "TypeError" &&
      (err.message?.toLowerCase().includes("fetch") || err.message?.toLowerCase().includes("network"))
    ) {
      throw new ApiError(
        `Unable to reach backend API at ${BASE_URL || "configured URL"}. Please check network connection, server health, and CORS permissions.`,
        0
      );
    }

    throw err;
  }
}

function authHeaders(token?: string | null): Record<string, string> {
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
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch<any>(`/api/products${queryStr}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      return { success: true, data: data.data };
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
    const data = await apiFetch<any>(`/api/products/${slug}?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (data && data.success && data.data) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn("[PLUXPC API] Product lookup fallback:", err);
  }

  const found = allProducts.find((p) => p.slug === slug) ?? null;
  return { success: !!found, data: found };
}

export async function fetchCategories(): Promise<ApiResponse<Category[]>> {
  try {
    const data = await apiFetch<any>("/api/categories");
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn("[PLUXPC API] Categories lookup fallback:", err);
  }

  return { success: true, data: shopCategories };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API (Protected - Preserved for cross-compatibility)
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
  return apiFetch<AdminAuthResponse>("/api/admin/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function adminGetMe(token?: string) {
  return apiFetch("/api/admin/auth/me", {
    headers: authHeaders(token),
  });
}

export async function adminGetDashboard(token?: string) {
  return apiFetch("/api/admin/dashboard", {
    headers: authHeaders(token),
  });
}

// Admin Products CRUD
export async function adminGetProducts(params?: { q?: string; category?: string; inStock?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch(`/api/admin/products${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
}

export async function adminGetProductById(id: string) {
  return apiFetch(`/api/admin/products/${id}`, {
    headers: authHeaders(),
  });
}

export async function adminCreateProduct(data: Partial<Product>) {
  return apiFetch("/api/admin/products", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateProduct(id: string, data: Partial<Product>) {
  return apiFetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteProduct(id: string) {
  return apiFetch(`/api/admin/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// Admin Categories CRUD
export async function adminGetCategories(params?: { q?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch(`/api/admin/categories${query ? `?${query}` : ""}`, {
    headers: authHeaders(),
  });
}

export async function adminCreateCategory(data: { name: string; slug?: string; imageUrl: string; description?: string }) {
  return apiFetch("/api/admin/categories", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCategory(id: string, data: Partial<Category>) {
  return apiFetch(`/api/admin/categories/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCategory(id: string) {
  return apiFetch(`/api/admin/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
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
}): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function customerLogin(credentials: {
  email: string;
  password: string;
}): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export async function customerGetProfile(token?: string | null): Promise<{ success: boolean; user?: any; message?: string }> {
  return apiFetch("/api/auth/me", {
    headers: customerHeaders(token),
  });
}

export async function customerLogout(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", {
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
  return apiFetch("/api/cart", {
    headers: customerHeaders(token),
  });
}

export async function customerAddToCart(productId: string, quantity = 1, token?: string | null) {
  return apiFetch("/api/cart/items", {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function customerUpdateCartItem(productId: string, quantity: number, token?: string | null) {
  return apiFetch(`/api/cart/items/${productId}`, {
    method: "PATCH",
    headers: customerHeaders(token),
    body: JSON.stringify({ quantity }),
  });
}

export async function customerRemoveCartItem(productId: string, token?: string | null) {
  return apiFetch(`/api/cart/items/${productId}`, {
    method: "DELETE",
    headers: customerHeaders(token),
  });
}

export async function customerClearCart(token?: string | null) {
  return apiFetch("/api/cart", {
    method: "DELETE",
    headers: customerHeaders(token),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WISHLIST API (Customer / Guest)
// ─────────────────────────────────────────────────────────────────────────────

export async function customerGetWishlist(token?: string | null) {
  return apiFetch("/api/wishlist", {
    headers: customerHeaders(token),
  });
}

export async function customerAddToWishlist(productId: string, token?: string | null) {
  return apiFetch("/api/wishlist/items", {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ productId }),
  });
}

export async function customerRemoveFromWishlist(productId: string, token?: string | null) {
  return apiFetch(`/api/wishlist/items/${productId}`, {
    method: "DELETE",
    headers: customerHeaders(token),
  });
}

export async function customerClearWishlist(token?: string | null) {
  return apiFetch("/api/wishlist", {
    method: "DELETE",
    headers: customerHeaders(token),
  });
}

export async function customerMergeWishlist(
  items: Array<{ productId: string } | string>,
  token?: string | null
) {
  return apiFetch("/api/wishlist/merge", {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ items }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS & ORDERS API
// ─────────────────────────────────────────────────────────────────────────────

export async function getRazorpayConfig() {
  return apiFetch("/api/payments/config");
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
  promoCode?: string,
  contactEmail?: string
) {
  return apiFetch("/api/payments/create-order", {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ deliveryAddress, promoCode, contactEmail }),
  });
}

export async function validatePromoCode(
  code: string,
  items: Array<{ product: string; quantity: number; price?: number }>,
  token?: string | null
) {
  return apiFetch("/api/promotions/validate", {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify({ code, items }),
  });
}

export async function fetchActivePromotions() {
  try {
    const data = await apiFetch<any>(`/api/promotions/active?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (data && (data.success || Array.isArray(data.promotions))) {
      return data;
    }
  } catch (err) {
    console.warn("[PLUXPC API] Active promotions unreachable:", err);
  }
  return { success: false, promotions: [] };
}

export async function fetchPlatformFeeConfig() {
  try {
    const data = await apiFetch<any>(`/api/platform-fee/config?_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
    if (data && (data.success || data.settings)) {
      return data;
    }
  } catch (err) {
    console.warn("[PLUXPC API] Platform fee config unreachable:", err);
  }
  return { success: false, settings: { enabled: false, feeType: "fixed", feeValue: 0 } };
}

export async function calculatePlatformFeeQuote(subtotal: number) {
  try {
    const data = await apiFetch<any>("/api/platform-fee/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal }),
    });
    if (data && (data.success || typeof data.platformFee === "number")) {
      return data;
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
  return apiFetch("/api/payments/verify", {
    method: "POST",
    headers: customerHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getCustomerOrders(token?: string | null) {
  return apiFetch("/api/orders/my-orders", {
    headers: customerHeaders(token),
  });
}

export async function getOrderById(orderId: string, token?: string | null) {
  return apiFetch(`/api/orders/${orderId}`, {
    headers: customerHeaders(token),
  });
}

// ── Blog API Functions ──
export async function getBlogs(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  tag?: string;
  sort?: "latest" | "popular" | "oldest";
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.tag) query.set("tag", params.tag);
  if (params?.sort) query.set("sort", params.sort);

  const qs = query.toString();
  return apiFetch<any>(`/api/blogs${qs ? `?${qs}` : ""}`);
}

export async function getFeaturedBlogs() {
  return apiFetch<any>("/api/blogs/featured");
}

export async function getBlogCategories() {
  return apiFetch<any>("/api/blogs/categories");
}

export async function getBlogBySlug(slug: string) {
  return apiFetch<any>(`/api/blogs/${encodeURIComponent(slug)}`);
}

// ── Legal Content API Functions ──
export async function getPublicLegalPage(slug: string) {
  return apiFetch<{ success: boolean; data: LegalPage }>(`/api/legal/${encodeURIComponent(slug)}`);
}

export { BASE_URL };
