import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CartItem, Product, CartData } from "../types";
import { useCustomerAuth } from "./CustomerAuthContext";
import {
  customerGetCart,
  customerAddToCart,
  customerUpdateCartItem,
  customerRemoveCartItem,
  customerClearCart,
} from "../services/api";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  platformFee: number;
  total: number;
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, qty?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (productId: string) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useCustomerAuth();

  const [cartData, setCartData] = useState<CartData>({
    items: [],
    itemCount: 0,
    subtotal: 0,
    shippingFee: 0,
    platformFee: 0,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from backend whenever customer auth state changes
  const fetchCartFromBackend = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setCartData({
        items: [],
        itemCount: 0,
        subtotal: 0,
        shippingFee: 0,
        total: 0,
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await customerGetCart(token);
      if (res.success && res.cart) {
        setCartData(res.cart);
      } else {
        setError(res.message || "Failed to load cart");
      }
    } catch (err: any) {
      console.warn("[Cart] Backend load error:", err);
      setError(err.message || "Network error loading cart");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchCartFromBackend();

    const handleSync = () => {
      if (document.visibilityState === "visible") {
        fetchCartFromBackend();
      }
    };

    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("voltix_promotions_sync");
      channel.onmessage = handleSync;
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
    };
  }, [fetchCartFromBackend]);

  const addToCart = async (
    product: Product,
    qty = 1
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated || !token) {
      return {
        success: false,
        message: "Please log in to add items to your cart",
      };
    }

    setLoading(true);
    setError(null);
    try {
      const res = await customerAddToCart(product.id, qty, token);
      if (res.success && res.cart) {
        setCartData(res.cart);
        return { success: true, message: res.message || `Added ${product.name} to cart` };
      }
      const msg = res.message || "Could not add item to cart";
      setError(msg);
      return { success: false, message: msg };
    } catch (err: any) {
      const msg = err.message || "Network error adding item";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (
    productId: string,
    quantity: number
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated || !token) {
      return { success: false, message: "Please log in" };
    }

    setLoading(true);
    setError(null);
    try {
      const res = await customerUpdateCartItem(productId, quantity, token);
      if (res.success && res.cart) {
        setCartData(res.cart);
        return { success: true };
      }
      const msg = res.message || "Could not update quantity";
      setError(msg);
      return { success: false, message: msg };
    } catch (err: any) {
      const msg = err.message || "Network error updating quantity";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (
    productId: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated || !token) {
      return { success: false, message: "Please log in" };
    }

    setLoading(true);
    setError(null);
    try {
      const res = await customerRemoveCartItem(productId, token);
      if (res.success && res.cart) {
        setCartData(res.cart);
        return { success: true };
      }
      const msg = res.message || "Could not remove item";
      setError(msg);
      return { success: false, message: msg };
    } catch (err: any) {
      const msg = err.message || "Network error removing item";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await customerClearCart(token);
      if (res.success && res.cart) {
        setCartData(res.cart);
      }
    } catch (err) {
      console.warn("[Cart] Clear error:", err);
    }
  };

  const value = {
    items: cartData.items,
    itemCount: cartData.itemCount,
    subtotal: cartData.subtotal,
    shippingFee: cartData.shippingFee,
    platformFee: cartData.platformFee || 0,
    total: cartData.total,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCartFromBackend,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

