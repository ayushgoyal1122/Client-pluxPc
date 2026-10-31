import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Product } from "../types";
import { useCustomerAuth } from "./CustomerAuthContext";
import {
  customerGetWishlist,
  customerAddToWishlist,
  customerRemoveFromWishlist,
  customerClearWishlist,
  customerMergeWishlist,
} from "../services/api";

const WISHLIST_STORAGE_KEY = "voltix_wishlist";

interface WishlistContextType {
  items: Product[];
  count: number;
  loading: boolean;
  error: string | null;
  isWishlisted: (id: string) => boolean;
  addToWishlist: (product: Product) => Promise<{ success: boolean; message?: string }>;
  removeFromWishlist: (productId: string) => Promise<{ success: boolean; message?: string }>;
  toggle: (product: Product) => Promise<{ success: boolean; wishlisted: boolean }>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function readStoredWishlist(): Product[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredWishlist(items: Product[]) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("[Wishlist] Failed to save to localStorage:", e);
  }
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useCustomerAuth();
  const [items, setItems] = useState<Product[]>(readStoredWishlist);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with backend when authenticated
  const syncWithBackend = useCallback(async () => {
    if (!isAuthenticated || !token) {
      // Guest mode: load from localStorage
      setItems(readStoredWishlist());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Check if there are local guest items to merge
      const localItems = readStoredWishlist();
      if (localItems.length > 0) {
        const payload = localItems.map((p) => ({ productId: p.id }));
        const mergeRes = await customerMergeWishlist(payload, token);
        if (mergeRes.success && mergeRes.wishlist) {
          const mergedProducts: Product[] = mergeRes.wishlist.items.map(
            (item: any) => item.product
          );
          setItems(mergedProducts);
          writeStoredWishlist(mergedProducts);
          setLoading(false);
          return;
        }
      }

      // Fetch user's wishlist from backend
      const res = await customerGetWishlist(token);
      if (res.success && res.wishlist) {
        const fetchedProducts: Product[] = res.wishlist.items.map(
          (item: any) => item.product
        );
        setItems(fetchedProducts);
        writeStoredWishlist(fetchedProducts);
      } else {
        setError(res.message || "Failed to load wishlist");
      }
    } catch (err: any) {
      console.warn("[Wishlist] Backend sync error:", err);
      setError(err.message || "Failed to sync wishlist with server");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  // Listen to window focus or cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === WISHLIST_STORAGE_KEY && !isAuthenticated) {
        setItems(readStoredWishlist());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isAuthenticated]);

  const isWishlisted = useCallback(
    (id: string): boolean => {
      if (!id) return false;
      const strId = String(id).trim().toLowerCase();
      return items.some((p) => {
        const pId = String(p.id ?? "").trim().toLowerCase();
        const pMongoId = String((p as any)._id ?? "").trim().toLowerCase();
        const pSlug = String(p.slug ?? "").trim().toLowerCase();
        return pId === strId || pMongoId === strId || pSlug === strId;
      });
    },
    [items]
  );

  const addToWishlist = useCallback(
    async (product: Product): Promise<{ success: boolean; message?: string }> => {
      if (!product || !product.id) return { success: false, message: "Invalid product" };

      if (isWishlisted(product.id)) {
        return { success: true, message: "Already in wishlist" };
      }

      const nextItems = [product, ...items];
      setItems(nextItems);
      writeStoredWishlist(nextItems);

      if (isAuthenticated && token) {
        try {
          const res = await customerAddToWishlist(product.id, token);
          if (res.success && res.wishlist) {
            const updated: Product[] = res.wishlist.items.map((i: any) => i.product);
            setItems(updated);
            writeStoredWishlist(updated);
          }
        } catch (err) {
          console.warn("[Wishlist] Failed to add on backend:", err);
        }
      }

      return { success: true, message: `"${product.name}" added to wishlist` };
    },
    [items, isWishlisted, isAuthenticated, token]
  );

  const removeFromWishlist = useCallback(
    async (productId: string): Promise<{ success: boolean; message?: string }> => {
      if (!productId) return { success: false };

      const strId = String(productId).trim().toLowerCase();
      const nextItems = items.filter((p) => {
        const pId = String(p.id ?? "").trim().toLowerCase();
        const pMongoId = String((p as any)._id ?? "").trim().toLowerCase();
        const pSlug = String(p.slug ?? "").trim().toLowerCase();
        return pId !== strId && pMongoId !== strId && pSlug !== strId;
      });

      setItems(nextItems);
      writeStoredWishlist(nextItems);

      if (isAuthenticated && token) {
        try {
          const res = await customerRemoveFromWishlist(productId, token);
          if (res.success && res.wishlist) {
            const updated: Product[] = res.wishlist.items.map((i: any) => i.product);
            setItems(updated);
            writeStoredWishlist(updated);
          }
        } catch (err) {
          console.warn("[Wishlist] Failed to remove on backend:", err);
        }
      }

      return { success: true, message: "Item removed from wishlist" };
    },
    [items, isAuthenticated, token]
  );

  const toggle = useCallback(
    async (product: Product): Promise<{ success: boolean; wishlisted: boolean }> => {
      if (!product) return { success: false, wishlisted: false };
      const currentlyWishlisted = isWishlisted(product.id);

      if (currentlyWishlisted) {
        await removeFromWishlist(product.id);
        return { success: true, wishlisted: false };
      } else {
        await addToWishlist(product);
        return { success: true, wishlisted: true };
      }
    },
    [isWishlisted, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(async () => {
    setItems([]);
    writeStoredWishlist([]);

    if (isAuthenticated && token) {
      try {
        await customerClearWishlist(token);
      } catch (err) {
        console.warn("[Wishlist] Failed to clear backend wishlist:", err);
      }
    }
  }, [isAuthenticated, token]);

  const refreshWishlist = useCallback(async () => {
    await syncWithBackend();
  }, [syncWithBackend]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        error,
        isWishlisted,
        addToWishlist,
        removeFromWishlist,
        toggle,
        clearWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export function useWishlistContext() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return ctx;
}

