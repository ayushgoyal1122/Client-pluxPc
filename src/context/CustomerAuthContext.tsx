import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CustomerUser } from "../types";
import {
  customerLogin,
  customerRegister,
  customerGetProfile,
  customerLogout,
  getCustomerToken,
  setCustomerToken,
} from "../services/api";

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(getCustomerToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore customer session on refresh
  const verifySession = useCallback(async () => {
    const activeToken = getCustomerToken();
    if (!activeToken) {
      setCustomer(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await customerGetProfile(activeToken);
      if (res.success && res.user && res.user.role === "customer") {
        setCustomer(res.user);
        setToken(activeToken);
      } else {
        // Expired or invalid token
        setCustomerToken(null);
        setCustomer(null);
        setToken(null);
      }
    } catch (err) {
      console.warn("[Customer Auth] Session verification error:", err);
      setCustomerToken(null);
      setCustomer(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email: string, password: string) => {
    try {
      const res = await customerLogin({ email, password });
      if (res.success && res.token && res.user) {
        setCustomerToken(res.token);
        setToken(res.token);
        setCustomer(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || "Invalid email or password" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to log in" };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => {
    try {
      const res = await customerRegister(data);
      if (res.success && res.token && res.user) {
        setCustomerToken(res.token);
        setToken(res.token);
        setCustomer(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || "Registration failed" };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to create account" };
    }
  };

  const logout = () => {
    customerLogout();
    setCustomerToken(null);
    setToken(null);
    setCustomer(null);
  };

  const value = {
    customer,
    token,
    isAuthenticated: Boolean(customer && token),
    isLoading,
    login,
    register,
    logout,
  };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
};

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}

