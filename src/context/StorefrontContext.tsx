import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { Product, Category } from "../types";
import { allProducts, shopCategories } from "../data/products";
import { fetchProducts, fetchCategories, fetchActivePromotions } from "../services/api";

interface StorefrontContextType {
  products: Product[];
  categories: Category[];
  activePromotions: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getSection: (sectionKey: string) => Product[];
  getByCategory: (categorySlug: string) => Product[];
}

const StorefrontContext = createContext<StorefrontContextType | undefined>(undefined);

export const StorefrontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(allProducts);
  const [categories, setCategories] = useState<Category[]>(shopCategories);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);

  const loadData = useCallback(async (silent = false) => {
    // Avoid concurrent overlapping requests
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) setLoading(true);
    try {
      const [prodRes, catRes, promoRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchActivePromotions(),
      ]);

      if (prodRes.success && prodRes.data && prodRes.data.length > 0) {
        setProducts(prodRes.data);
      }
      if (catRes.success && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data);
      }
      if (promoRes.success && Array.isArray(promoRes.promotions)) {
        setActivePromotions(promoRes.promotions);
      }
      setError(null);
    } catch (err: any) {
      console.warn("[Storefront] Error loading live API data:", err);
      if (!silent) setError(err.message || "Failed to load live data");
    } finally {
      isFetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Real-time automatic synchronization without manual reload
  useEffect(() => {
    // 1. Refresh immediately when window or tab gains focus
    const handleFocus = () => {
      loadData(true);
    };

    // 2. Refresh immediately when tab becomes visible (user switches back to website)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 3. Lightweight background poll every 3.5 seconds while tab is active
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData(true);
      }
    }, 3500);

    // 4. Cross-tab synchronization via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("voltix_promotions_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "PROMOTIONS_UPDATED") {
          loadData(true);
        }
      };
    } catch {
      // BroadcastChannel optional fallback
    }

    // 5. Cross-tab synchronization via localStorage storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "voltix_promotions_updated") {
        loadData(true);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      clearInterval(intervalId);
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
    };
  }, [loadData]);

  const getSection = useCallback(
    (sectionKey: string) => {
      return products.filter((p) => p.section?.includes(sectionKey));
    },
    [products]
  );

  const getByCategory = useCallback(
    (categorySlug: string) => {
      return products.filter((p) => p.category === categorySlug);
    },
    [products]
  );

  return (
    <StorefrontContext.Provider
      value={{
        products,
        categories,
        activePromotions,
        loading,
        error,
        refresh: async () => loadData(false),
        getSection,
        getByCategory,
      }}
    >
      {children}
    </StorefrontContext.Provider>
  );
};

export function useStorefront() {
  const ctx = useContext(StorefrontContext);
  if (!ctx) {
    throw new Error("useStorefront must be used within a StorefrontProvider");
  }
  return ctx;
}
