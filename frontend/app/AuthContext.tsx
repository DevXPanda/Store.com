"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import { apiUrl } from "@/lib/apiBase";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin" | "delivery";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  /** After email/phone OTP verification — same cookies as password login */
  setSession: (token: string, user: AuthUser) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => void;
  isAdmin: boolean;
  isDelivery: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = Cookies.get("vegfru_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        Cookies.set("vegfru_user", JSON.stringify(data.user), { expires: 7 });
        Cookies.set("vegfru_token", data.token, { expires: 7 });
        return { success: true, role: data.user.role };
      }
      return { success: false, error: data.error || "Login failed" };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const setSession = (token: string, u: AuthUser) => {
    setUser(u);
    Cookies.set("vegfru_user", JSON.stringify(u), { expires: 7 });
    Cookies.set("vegfru_token", token, { expires: 7 });
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      Cookies.set("vegfru_user", JSON.stringify(next), { expires: 7 });
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("vegfru_user");
    Cookies.remove("vegfru_token");
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, setSession, updateUser, logout,
      isAdmin: user?.role === "admin",
      isDelivery: user?.role === "delivery",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
