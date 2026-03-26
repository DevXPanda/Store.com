"use client";
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard, Users, ShoppingBag, Package, Truck,
  Activity, LogOut, Shield, ShieldCheck,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Loader2,
  RefreshCw, Download, ChevronDown, ArrowUpRight,
  Bell, Database, Globe, Lock, Unlock, UserPlus,
  BarChart3, PieChart, DollarSign, Zap, Archive,
  IndianRupee, Mail, Phone, MapPin, Calendar,
  Key, Terminal, Server, Cpu, HardDrive, Sun, Moon, Menu, Leaf,
  ClipboardList
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type Tab = "dashboard" | "users" | "applications" | "orders" | "products" | "delivery" | "payouts" | "analytics" | "logs";
const VALID_TABS: readonly Tab[] = ["dashboard", "users", "applications", "orders", "products", "delivery", "payouts", "analytics", "logs"];
function tabFromSearchParams(sp: { get: (name: string) => string | null }): Tab {
  const p = sp.get("tab") as Tab | null;
  return p && (VALID_TABS as readonly string[]).includes(p) ? p : "dashboard";
}
type Role = "superadmin" | "admin" | "delivery" | "customer";

// ── Convex helpers ────────────────────────────────────────────
const CURL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const cq = async (path: string, args: object = {}) => {
  if (!CURL) return null;
  try {
    const r = await fetch(`${CURL}/api/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, args }) });
    return (await r.json()).value;
  } catch { return null; }
};
const cm = async (path: string, args: object = {}) => {
  if (!CURL) return null;
  const r = await fetch(`${CURL}/api/mutation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, args }) });
  const j = await r.json() as { status?: string; errorMessage?: string; value?: unknown };
  if (j.status === "error" || j.errorMessage) {
    throw new Error(j.errorMessage || "Mutation failed");
  }
  if (!r.ok) throw new Error(await r.text());
  return j.value;
};

// ── Utils ─────────────────────────────────────────────────────
const fmt = (ts: number) => {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const currency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const ROLE_CFG: Record<Role, { label: string; color: string; bg: string; border: string }> = {
  superadmin: { label: "Super Admin", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
  admin: { label: "Admin", color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  delivery: { label: "Delivery", color: "#fb923c", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  customer: { label: "Customer", color: "#4ade80", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.3)" },
};

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  confirmed: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  preparing: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  assigned: { color: "#22d3ee", bg: "rgba(34,211,238,0.1)" },
  picked_up: { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  out_for_delivery: { color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
  delivered: { color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};

// ── Sub-components ────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }: any) {
  return (
    <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: "18px 20px", transition: "border-color 0.2s" }}
      onMouseEnter={e => (e.currentTarget as any).style.borderColor = `${color}40`}
      onMouseLeave={e => { (e.currentTarget as any).style.borderColor = "var(--sa-card-border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
        {trend != null && <span style={{ fontSize: 11, fontWeight: 600, color: trend >= 0 ? "#16a34a" : "#dc2626", background: trend >= 0 ? "rgba(34,197,94,0.12)" : "rgba(248,113,113,0.12)", padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3 }}>
          {trend >= 0 ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}{Math.abs(trend)}%
        </span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "var(--sa-text)", letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--sa-muted)", marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: color, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ role }: { role: string }) {
  const c = ROLE_CFG[role as Role] || { label: role, color: "#9ca3af", bg: "rgba(156,163,175,0.1)", border: "rgba(156,163,175,0.2)" };
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.3px" }}>{c.label}</span>;
}

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] || { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" };
  return <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
    {status.replace(/_/g, " ")}
  </span>;
}

function Modal({ title, subtitle, onClose, children, width = 520 }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--sa-overlay)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fade-in" style={{ background: "var(--sa-modal-bg)", border: "1px solid var(--sa-modal-border)", borderRadius: 22, width: "100%", maxWidth: width, maxHeight: "88vh", overflow: "auto", boxShadow: "var(--sa-modal-shadow)" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "var(--sa-modal-bg)", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--sa-text)" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--sa-muted)", marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: "var(--sa-surface)", border: "none", borderRadius: 8, color: "var(--sa-muted)", cursor: "pointer", padding: 6, display: "flex", flexShrink: 0, marginLeft: 12 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required = false, readOnly = false, hint }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>
        {label}{required && " *"}
      </label>
      <input value={value} onChange={e => onChange && onChange(e.target.value)} type={type} placeholder={placeholder} readOnly={readOnly}
        style={{ width: "100%", background: readOnly ? "var(--sa-surface)" : "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "10px 12px", color: readOnly ? "var(--sa-muted)" : "var(--sa-input-text)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", cursor: readOnly ? "not-allowed" : "text" }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = "rgba(34,197,94,0.6)" }}
        onBlur={e => e.target.style.borderColor = "var(--sa-input-border)"} />
      {hint && <div style={{ fontSize: 11, color: "var(--sa-muted)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "10px 12px", color: "var(--sa-input-text)", fontSize: 13, outline: "none", appearance: "none" }}>
        {options.map((o: any) => <option key={o.value || o} value={o.value || o} style={{ background: "var(--sa-modal-bg)", color: "var(--sa-text)" }}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function PrimaryBtn({ label, onClick, loading, icon: Icon, color = "#14532d", disabled = false }: any) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: disabled ? "var(--sa-surface)" : `linear-gradient(135deg,${color},${color}cc)`, color: "#fff", border: "none", borderRadius: 11, padding: "11px 20px", fontSize: 13, fontWeight: 600, cursor: loading || disabled ? "not-allowed" : "pointer", width: "100%", marginTop: 4, boxShadow: disabled ? "none" : `0 4px 16px ${color}40`, opacity: loading ? 0.8 : 1, transition: "opacity 0.2s" }}>
      {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : Icon && <Icon size={15} />}
      {loading ? "Saving..." : label}
    </button>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function SuperAdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => tabFromSearchParams(searchParams));
  const [saUser, setSaUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [partnerApplications, setPartnerApplications] = useState<any[]>([]);
  const [deliveryPartnerApplications, setDeliveryPartnerApplications] = useState<any[]>([]);
  const [processedFranchiseApps, setProcessedFranchiseApps] = useState<any[]>([]);
  const [processedRiderApps, setProcessedRiderApps] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const productSearchFocusedRef = useRef(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" }>({ msg: "", type: "ok" });
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const seenOrderIds = useRef<Set<string>>(new Set());

  const playNotifSound = useCallback((type: "alert" | "chime" = "alert") => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const playTone = (freq: number, start: number, duration: number, vol: number) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        g.gain.setValueAtTime(0, ctx.currentTime + start);
        g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.05);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      if (type === "alert") {
        playTone(880, 0, 0.4, 0.1);
        playTone(660, 0.15, 0.5, 0.08);
      } else {
        playTone(523.25, 0, 0.6, 0.1); // C5 chime
      }
    } catch { }
  }, []);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showAuthPw, setShowAuthPw] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");

  // Modals
  const [createUserModal, setCreateUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState<any>(null);
  const [deleteUserModal, setDeleteUserModal] = useState<any>(null);
  const [viewOrderModal, setViewOrderModal] = useState<any>(null);
  const [createProductModal, setCreateProductModal] = useState(false);
  const [editProductModal, setEditProductModal] = useState<any>(null);
  const [deleteProductModal, setDeleteProductModal] = useState<any>(null);
  const [deleteSelectedProductIds, setDeleteSelectedProductIds] = useState<string[] | null>(null);
  const [partnerDetailModal, setPartnerDetailModal] = useState<any>(null);
  const [deliveryPartnerDetailModal, setDeliveryPartnerDetailModal] = useState<any>(null);

  // Forms
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", phone: "", role: "delivery" });
  const [editUserForm, setEditUserForm] = useState({ name: "", phone: "", role: "", isActive: true, newPassword: "" });
  const [productForm, setProductForm] = useState({ name: "", category: "vegetables", price: "", originalPrice: "", unit: "", emoji: "🥬", stock: "", description: "", tag: "Organic", badge: "", image: "" });
  const [editProductForm, setEditProductForm] = useState({ price: "", stock: "", badge: "", description: "", image: "", isActive: true });

  // Keep tab in sync when ?tab= changes (back/forward, deep links) without racing router.replace below.
  useLayoutEffect(() => {
    setTab(tabFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== tab) {
      router.replace(`/superadmin?tab=${tab}`);
    }
  }, [tab, router, searchParams]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "ok" }), 3000);
  };

  // Load everything
  const loadAll = useCallback(async () => {
    if (!CURL) { setLoading(false); return; }
    setLoading(true);
    try {
      const [u, o, p, d, a, rv, tp, pa, dpa, pfa, pra, pay] = await Promise.all([
        cq("auth:getAllUsers", {}),
        cq("orders:getAllOrders", { limit: 500 }),
        cq("products:getAllProducts", { includeInactive: true }),
        cq("auth:getAllDeliveryBoys", {}),
        cq("auth:getActivityLog", { limit: 200 }),
        cq("orders:getRevenueByDay", { days: 30 }),
        cq("orders:getTopProducts", {}),
        cq("adminPhoneAuth:listPendingOnboardingApplications", {}),
        cq("deliveryPartnerAuth:listPendingDeliveryPartnerApplications", {}),
        cq("adminPhoneAuth:listProcessedOnboardingApplications", { limit: 200 }),
        cq("deliveryPartnerAuth:listProcessedDeliveryPartnerApplications", { limit: 200 }),
        cq("payouts:getPayoutHistory"),
      ]);
      setUsers(u || []); setOrders(o || []); setProducts(p || []);
      setDeliveryBoys(d || []); setActivityLog(a || []);
      setRevenueData(rv || []); setTopProducts(tp || []);
      setPartnerApplications(Array.isArray(pa) ? pa : []);
      setDeliveryPartnerApplications(Array.isArray(dpa) ? dpa : []);
      setProcessedFranchiseApps(Array.isArray(pfa) ? pfa : []);
      setProcessedRiderApps(Array.isArray(pra) ? pra : []);
      setPayouts(pay || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const wantsSignIn = searchParams.get("signin") === "1";
    let nextUser: any = null;
    try {
      const s = localStorage.getItem("vegfru_superadmin");
      if (s) nextUser = JSON.parse(s);
    } catch { }
    if (!nextUser && typeof document !== "undefined") {
      try {
        const cookieUser = document.cookie
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith("sa_user="));
        if (cookieUser) {
          nextUser = JSON.parse(decodeURIComponent(cookieUser.split("=")[1]));
        }
      } catch { }
    }
    if (nextUser?.role === "superadmin") {
      setSaUser(nextUser);
      setShowSignIn(false);
    } else {
      setSaUser(null);
      setShowSignIn(true);
      if (wantsSignIn) {
        router.replace("/superadmin");
      }
    }
    setAuthChecked(true);
  }, [router, searchParams]);

  useEffect(() => {
    if (!saUser) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [loadAll, saUser]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("vegfru_superadmin_theme");
      if (savedTheme === "light") setIsDarkMode(false);
    } catch { }
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem("vegfru_superadmin_theme", next ? "dark" : "light"); } catch { }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-sa-theme", isDarkMode ? "dark" : "light");
    document.documentElement.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  useEffect(() => {
    if (!saUser) return;
    const t = setInterval(loadAll, 30000);
    return () => clearInterval(t);
  }, [loadAll, saUser]);

  // Keep selected products list valid as products reload.
  useEffect(() => {
    setSelectedProductIds(prev => prev.filter(id => products.some((p: any) => p._id === id)));
  }, [products]);

  useEffect(() => {
    if (productSearchFocusedRef.current) {
      productSearchInputRef.current?.focus();
    }
  }, [productSearch]);

  useEffect(() => {
    if (orders.length === 0) return;
    const isFirstLoad = seenOrderIds.current.size === 0;
    const newIds = orders.filter(o => !seenOrderIds.current.has(o._id));
    if (newIds.length > 0) {
      if (!isFirstLoad) {
        const hasNewPending = newIds.some(o => o.status === "pending");
        if (hasNewPending) playNotifSound("alert");
      }
      newIds.forEach(o => seenOrderIds.current.add(o._id));
    }
  }, [orders, playNotifSound]);

  const handleSuperAdminSignIn = async () => {
    if (!authForm.email || !authForm.password) {
      setAuthError("Please fill all fields");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (data.success) {
        if (data.otpRequired) {
           setOtpRequired(true);
           if (data.devCode) console.log("SuperAdmin OTP (Dev):", data.devCode);
           setAuthLoading(false);
           return;
        }
        completeSuperAdminLogin(data);
        return;
      }
      setAuthError(data.error || "Invalid credentials. Superadmin account required.");
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleVerifySuperAdminOtp = async () => {
    if (!otp || otp.length < 6) {
      setAuthError("Enter 6-digit code");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authForm.email, otp }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        completeSuperAdminLogin(data);
      } else {
        setAuthError(data.error || "Invalid OTP");
      }
    } catch {
      setAuthError("Network error");
    }
    setAuthLoading(false);
  };

  const completeSuperAdminLogin = (data: any) => {
    const encoded = encodeURIComponent(JSON.stringify(data.user));
    document.cookie = `sa_token=${data.token};path=/;max-age=${8 * 3600};samesite=strict`;
    document.cookie = `sa_user=${encoded};path=/;max-age=${8 * 3600};samesite=strict`;
    localStorage.setItem("vegfru_superadmin", JSON.stringify(data.user));
    setSaUser(data.user);
    setShowSignIn(false);
    setAuthForm({ email: "", password: "" });
    setOtp("");
    setOtpRequired(false);
    setAuthError("");
  };

  if (!authChecked) {
    return null;
  }

  if (!saUser) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(88,28,135,0.15) 0%, #060810 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "fixed", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(0deg,#a855f7 0,#a855f7 1px,transparent 0,transparent 60px),repeating-linear-gradient(90deg,#a855f7 0,#a855f7 1px,transparent 0,transparent 60px)", pointerEvents: "none" }} />
        {showSignIn && (
          <div className="fade-in" style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 460, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.24)", backdropFilter: "blur(18px)", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#9333ea)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={20} color="#fff" />
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Super Admin Sign In</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>Use your superadmin credentials</div>
              </div>
            </div>

            {authError && <div style={{ marginBottom: 12, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#fda4af", fontSize: 13, padding: "10px 12px" }}>{authError}</div>}

            {!otpRequired ? (
              <>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.38)", fontFamily: "monospace", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 7 }}>Email</label>
                <input
                  type="email"
                  autoComplete="username"
                  value={authForm.email}
                  onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 12 }}
                />

                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.38)", fontFamily: "monospace", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 7 }}>Password</label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <input
                    type={showAuthPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleSuperAdminSignIn()}
                    placeholder="••••••••"
                    style={{ width: "100%", padding: "12px 44px 12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, outline: "none" }}
                  />
                  <button type="button" onClick={() => setShowAuthPw((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex" }}>
                    {showAuthPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleSuperAdminSignIn}
                  style={{ width: "100%", border: "none", borderRadius: 12, padding: "12px 14px", background: authLoading ? "rgba(124,58,237,0.6)" : "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: authLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {authLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Signing in...</> : <><Lock size={15} />Sign In</>}
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16, textAlign: "center", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  Enter the 6-digit code sent to<br/>
                  <span style={{ color: "#a855f7", fontWeight: 600 }}>{authForm.email}</span>
                </div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.38)", fontFamily: "monospace", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 7 }}>Email OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifySuperAdminOtp()}
                  placeholder="000000"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 12, color: "#fff", fontSize: 24, fontWeight: 700, letterSpacing: 8, textAlign: "center", outline: "none", marginBottom: 16 }}
                />

                <button
                  type="button"
                  disabled={authLoading || otp.length < 6}
                  onClick={handleVerifySuperAdminOtp}
                  style={{ width: "100%", border: "none", borderRadius: 12, padding: "12px 14px", background: (authLoading || otp.length < 6) ? "rgba(124,58,237,0.6)" : "linear-gradient(135deg,#7c3aed,#9333ea)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: (authLoading || otp.length < 6) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {authLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Verifying...</> : <><CheckCircle size={15} />Verify & Access</>}
                </button>
                
                <button
                  type="button"
                  onClick={() => { setOtpRequired(false); setOtp(""); }}
                  style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 12, cursor: "pointer", textDecoration: "underline" }}
                >
                  Change account
                </button>
              </>
            )}
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.25s ease-out}`}</style>
      </div>
    );
  }

  // ── Computed stats ──────────────────────────────────────────
  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === "pending");
  const todayOrders = orders.filter(o => Date.now() - o.createdAt < 86400000);
  const weekRevenue = orders.filter(o => o.status === "delivered" && Date.now() - o.createdAt < 7 * 86400000).reduce((s: number, o: any) => s + o.total, 0);
  const activeProducts = products.filter(p => p.isActive);
  const lowStockItems = products.filter(p => p.stock < 10 && p.isActive);
  const adminCount = users.filter(u => ["admin", "superadmin"].includes(u.role)).length;
  const customerCount = users.filter(u => u.role === "customer").length;
  const deliveryCount = users.filter(u => u.role === "delivery").length;

  // ── Actions ─────────────────────────────────────────────────
  async function createUser() {
    if (!userForm.name || !userForm.email || !userForm.password) { showToast("Fill all required fields", "err"); return; }
    setBusy(true);
    try {
      const bcrypt = await import("bcryptjs") as any;
      const hash = await bcrypt.hash(userForm.password, 10);
      await cm("auth:createUser", { name: userForm.name, email: userForm.email.toLowerCase().trim(), passwordHash: hash, role: userForm.role, phone: userForm.phone || undefined, createdBy: saUser?._id || "superadmin" });
      setCreateUserModal(false); setUserForm({ name: "", email: "", password: "", phone: "", role: "delivery" });
      await loadAll(); showToast(`${userForm.role} account created`);
    } catch (e: any) { showToast(e.message || "Failed", "err"); }
    setBusy(false);
  }

  async function saveEditUser() {
    if (!editUserModal) return;
    setBusy(true);
    try {
      await cm("auth:updateUser", { id: editUserModal._id, name: editUserForm.name || undefined, phone: editUserForm.phone || undefined, role: editUserForm.role as any || undefined, isActive: editUserForm.isActive, updatedBy: saUser?._id || "superadmin" });
      if (editUserForm.newPassword && editUserForm.newPassword.length >= 6) {
        const bcrypt = await import("bcryptjs") as any;
        const hash = await bcrypt.hash(editUserForm.newPassword, 10);
        await cm("auth:updateUserPassword", { id: editUserModal._id, passwordHash: hash });
      }
      setUsers(prev => prev.map(u => u._id === editUserModal._id ? { ...u, ...editUserForm } : u));
      setEditUserModal(null); showToast("User updated");
    } catch { showToast("Update failed", "err"); }
    setBusy(false);
  }

  async function confirmDeleteUser() {
    if (!deleteUserModal) return;
    setBusy(true);
    try {
      await cm("auth:deleteUser", { id: deleteUserModal._id, deletedBy: saUser?._id || "superadmin" });
      setUsers(prev => prev.filter(u => u._id !== deleteUserModal._id));
      setDeleteUserModal(null); showToast("User permanently deleted");
    } catch { showToast("Delete failed", "err"); }
    setBusy(false);
  }

  async function toggleUserStatus(u: any) {
    await cm("auth:updateUserStatus", { id: u._id, isActive: !u.isActive });
    setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x));
    showToast(u.isActive ? "Account suspended" : "Account activated");
  }

  const reviewerConvexId = () => (saUser?.id || saUser?._id) as string | undefined;

  async function approvePartnerApplication(appId: string) {
    const rid = reviewerConvexId();
    if (!rid) { showToast("Session missing — sign in again", "err"); return; }
    setBusy(true);
    try {
      await cm("adminPhoneAuth:approveOnboardingApplication", {
        applicationId: appId,
        reviewerId: rid,
      });
      await loadAll();
      showToast("Partner approved — admin account created");
      setPartnerDetailModal(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Could not approve", "err");
    }
    setBusy(false);
  }

  async function rejectPartnerApplication(appId: string) {
    const rid = reviewerConvexId();
    if (!rid) { showToast("Session missing — sign in again", "err"); return; }
    setBusy(true);
    try {
      await cm("adminPhoneAuth:rejectOnboardingApplication", {
        applicationId: appId,
        reviewerId: rid,
      });
      await loadAll();
      showToast("Application rejected");
      setPartnerDetailModal(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Could not reject", "err");
    }
    setBusy(false);
  }

  async function approveDeliveryPartnerApp(appId: string) {
    const rid = reviewerConvexId();
    if (!rid) { showToast("Session missing — sign in again", "err"); return; }
    setBusy(true);
    try {
      await cm("deliveryPartnerAuth:approveDeliveryPartnerApplication", {
        applicationId: appId,
        reviewerId: rid,
      });
      await loadAll();
      showToast("Delivery partner approved — they can sign in with phone OTP");
      setDeliveryPartnerDetailModal(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Could not approve", "err");
    }
    setBusy(false);
  }

  async function rejectDeliveryPartnerApp(appId: string) {
    const rid = reviewerConvexId();
    if (!rid) { showToast("Session missing — sign in again", "err"); return; }
    setBusy(true);
    try {
      await cm("deliveryPartnerAuth:rejectDeliveryPartnerApplication", {
        applicationId: appId,
        reviewerId: rid,
      });
      await loadAll();
      showToast("Delivery application rejected");
      setDeliveryPartnerDetailModal(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Could not reject", "err");
    }
    setBusy(false);
  }

  async function createProduct() {
    if (!productForm.name || !productForm.price) { showToast("Name and price required", "err"); return; }
    setBusy(true);
    try {
      await cm("products:createProduct", {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice) || Number(productForm.price),
        unit: productForm.unit || "1 pc",
        emoji: productForm.emoji,
        stock: Number(productForm.stock) || 0,
        description: productForm.description,
        tag: productForm.tag,
        badge: productForm.badge || undefined,
        image: productForm.image.trim() || undefined,
      });
      setCreateProductModal(false); setProductForm({ name: "", category: "vegetables", price: "", originalPrice: "", unit: "", emoji: "🥬", stock: "", description: "", tag: "Organic", badge: "", image: "" });
      await loadAll(); showToast("Product added to catalog");
    } catch (e: any) { showToast(e.message || "Failed", "err"); }
    setBusy(false);
  }

  async function onProductImageFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "err");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setProductForm(f => ({ ...f, image: dataUrl }));
      showToast("Image selected");
    } catch {
      showToast("Could not read image", "err");
    }
  }

  async function onEditProductImageFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "err");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setEditProductForm(f => ({ ...f, image: dataUrl }));
      showToast("Image selected");
    } catch {
      showToast("Could not read image", "err");
    }
  }

  async function saveEditProduct() {
    if (!editProductModal) return;
    setBusy(true);
    try {
      await cm("products:updateProduct", {
        id: editProductModal._id,
        price: Number(editProductForm.price) || editProductModal.price,
        stock: Number(editProductForm.stock) || editProductModal.stock,
        badge: editProductForm.badge || undefined,
        description: editProductForm.description || undefined,
        image: editProductForm.image.trim() || undefined,
        isActive: editProductForm.isActive
      });
      setProducts(prev => prev.map(p => p._id === editProductModal._id
        ? {
          ...p,
          ...editProductForm,
          price: Number(editProductForm.price) || p.price,
          stock: Number(editProductForm.stock) || p.stock,
          image: editProductForm.image.trim() || p.image
        }
        : p));
      setEditProductModal(null); showToast("Product updated");
    } catch { showToast("Update failed", "err"); }
    setBusy(false);
  }

  async function bulkSetProductActive(isActive: boolean) {
    if (selectedProductIds.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(selectedProductIds.map(id => cm("products:updateProduct", { id, isActive })));
      setProducts(prev => prev.map(p => selectedProductIds.includes(p._id) ? { ...p, isActive } : p));
      showToast(`${selectedProductIds.length} product(s) ${isActive ? "activated" : "deactivated"}`);
      setSelectedProductIds([]);
    } catch {
      showToast("Bulk update failed", "err");
    }
    setBusy(false);
  }

  async function deleteProduct(id: string) {
    await cm("products:deleteProduct", { id });
    setProducts(prev => prev.filter(p => p._id !== id));
    showToast("Product deleted from catalog");
  }

  async function confirmDeleteProduct() {
    if (!deleteProductModal?._id) return;
    setBusy(true);
    try {
      await deleteProduct(deleteProductModal._id);
      setDeleteProductModal(null);
    } catch {
      showToast("Failed to delete product", "err");
    }
    setBusy(false);
  }

  async function confirmDeleteSelectedProducts() {
    if (!deleteSelectedProductIds || deleteSelectedProductIds.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(deleteSelectedProductIds.map(id => cm("products:deleteProduct", { id })));
      setProducts(prev => prev.filter(p => !deleteSelectedProductIds.includes(p._id)));
      setSelectedProductIds([]);
      setDeleteSelectedProductIds(null);
      showToast(`${deleteSelectedProductIds.length} product(s) deleted`);
    } catch {
      showToast("Bulk delete failed", "err");
    }
    setBusy(false);
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await cm("orders:updateOrderStatus", { orderId, status, note: "Updated by superadmin" });
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    showToast(`Order → ${status}`);
  }

  function exportCSV(data: any[], headers: string[], keys: string[], filename: string) {
    const rows = [headers, ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === "string" ? `"${v.replace(/"/g, "'")}"` : v ?? ""; }))];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast(`Exported ${data.length} rows`);
  }

  // ── NAV ─────────────────────────────────────────────────────
  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "applications", label: "Partner applications", icon: ClipboardList },
    { id: "orders", label: "All Orders", icon: ShoppingBag },
    { id: "products", label: "Product Catalog", icon: Package },
    { id: "delivery", label: "Delivery Ops", icon: Truck },
    { id: "payouts", label: "Payout Requests", icon: IndianRupee },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "logs", label: "Activity Logs", icon: Activity },
  ];

  // ── SIDEBAR ─────────────────────────────────────────────────
  const Sidebar = () => (
    <aside style={{ width: isMobile ? 264 : (sidebarOpen ? 264 : 72), flexShrink: 0, background: "var(--sa-sidebar)", borderRight: "1px solid var(--sa-panel-border)", display: "flex", flexDirection: "column", transition: "transform 0.25s, width 0.25s", overflow: "hidden", position: isMobile ? "fixed" : "relative", top: isMobile ? 0 : undefined, left: isMobile ? 0 : undefined, height: isMobile ? "100vh" : undefined, zIndex: isMobile ? 120 : 1, transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none" }}>
      {/* Purple accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: "linear-gradient(90deg,#14532d,#166534,#16a34a)" }} />

      {/* Top spacing (brand is in navbar only) */}
      <div style={{ height: 12, borderBottom: "1px solid rgba(22,163,74,0.14)" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => { setTab(id as Tab); if (isMobile) setSidebarOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: sidebarOpen ? "11px 12px" : "11px 10px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontSize: 14, fontWeight: active ? 600 : 500, transition: "all 0.15s", background: active ? "linear-gradient(135deg,#14532d,#166534)" : "transparent", color: active ? "#fff" : "var(--sa-muted)", boxShadow: active ? "0 4px 14px rgba(20,83,45,0.35)" : "none" }}
              title={!sidebarOpen ? label : undefined}>
              <Icon size={17} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
              {sidebarOpen && id === "users" && users.length > 0 && <span style={{ background: "rgba(34,197,94,0.2)", color: "#16a34a", fontSize: 10, padding: "2px 7px", borderRadius: 999, fontFamily: "monospace" }}>{users.length}</span>}
              {sidebarOpen && id === "applications" && (partnerApplications.length + deliveryPartnerApplications.length) > 0 && <span style={{ background: "rgba(96,165,250,0.2)", color: "#2563eb", fontSize: 10, padding: "2px 7px", borderRadius: 999, fontFamily: "monospace" }}>{partnerApplications.length + deliveryPartnerApplications.length}</span>}
              {sidebarOpen && id === "orders" && pendingOrders.length > 0 && <span style={{ background: "rgba(251,191,36,0.2)", color: "#b45309", fontSize: 10, padding: "2px 7px", borderRadius: 999, fontFamily: "monospace" }}>{pendingOrders.length}</span>}
              {sidebarOpen && id === "payouts" && payouts.filter((p: any) => p.status === "pending").length > 0 && <span style={{ background: "rgba(239,68,68,0.2)", color: "#dc2626", fontSize: 10, padding: "2px 7px", borderRadius: 999, fontFamily: "monospace" }}>{payouts.filter((p: any) => p.status === "pending").length}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(22,163,74,0.14)" }}>
        {sidebarOpen && <div style={{ background: "rgba(34,197,94,0.06)", borderRadius: 12, padding: "11px 12px", marginBottom: 10, border: "1px solid rgba(34,197,94,0.1)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>{saUser?.name || "Super Admin"}</div>
          <div style={{ fontSize: 10, color: "var(--sa-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{saUser?.email || "superadmin@vegfru.com"}</div>
        </div>}
        <button onClick={() => { document.cookie = "sa_token=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/"; document.cookie = "sa_user=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/"; localStorage.removeItem("vegfru_superadmin"); window.location.href = "/"; }}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: sidebarOpen ? "10px 12px" : "10px 10px", borderRadius: 12, background: "transparent", color: "var(--sa-muted)", border: "none", cursor: "pointer", width: "100%", fontSize: 14, fontWeight: 500, transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as any).style.color = "#f87171" }}
          onMouseLeave={e => { (e.currentTarget as any).style.background = "transparent"; (e.currentTarget as any).style.color = "var(--sa-muted)" }}>
          <LogOut size={17} style={{ flexShrink: 0 }} />{sidebarOpen && "Sign Out"}
        </button>
      </div>
    </aside>
  );

  // ── DASHBOARD TAB ────────────────────────────────────────────
  const DashboardTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ background: "linear-gradient(135deg, rgba(20,83,45,0.16), rgba(22,163,74,0.1))", border: "1px solid rgba(22,163,74,0.22)", borderRadius: 18, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--sa-text)" }}>Super Admin Overview</div>
            <div style={{ fontSize: 12, color: "var(--sa-subtle)", marginTop: 3 }}>Realtime snapshot across revenue, users, orders, and operations.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", padding: "4px 10px", borderRadius: 999 }}>Delivered {orders.filter((o: any) => o.status === "delivered").length}</span>
            <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", padding: "4px 10px", borderRadius: 999 }}>Pending {pendingOrders.length}</span>
            <span style={{ fontSize: 11, color: "#60a5fa", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", padding: "4px 10px", borderRadius: 999 }}>Active Delivery {deliveryBoys.filter((b: any) => b.isActive).length}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        <StatCard icon={IndianRupee} label="Total Revenue" value={currency(totalRevenue)} sub={`${currency(weekRevenue)} this week`} color="#4ade80" trend={12} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={orders.length} sub={`${pendingOrders.length} pending`} color="#60a5fa" trend={8} />
        <StatCard icon={Users} label="Total Users" value={users.length} sub={`${adminCount} admins · ${deliveryCount} delivery`} color="#22c55e" trend={5} />
        <StatCard icon={Package} label="Active Products" value={activeProducts.length} sub={`${lowStockItems.length} low stock`} color="#fb923c" trend={null} />
        <StatCard icon={Zap} label="Today's Orders" value={todayOrders.length} sub={`${todayOrders.filter((o: any) => o.status === "delivered").length} delivered`} color="#16a34a" trend={null} />
        <StatCard icon={Truck} label="Delivery Partners" value={deliveryCount} sub={`${deliveryBoys.filter((b: any) => b.isActive).length} active`} color="#22d3ee" trend={null} />
      </div>

      {revenueData.length > 0 && (
        <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sa-text)" }}>Revenue Trend - Last 30 Days</span>
            <span style={{ fontSize: 12, color: "#4ade80" }}>{currency(revenueData.reduce((s: number, d: any) => s + d.revenue, 0))} total</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 110 }}>
            {revenueData.map((d: any) => {
              const max = Math.max(...revenueData.map((x: any) => x.revenue), 1);
              const pct = d.revenue / max;
              const label = new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
              return (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${label}: ${currency(d.revenue)}`}>
                  <div style={{ width: "100%", background: "var(--sa-ghost-bg)", borderRadius: 5, height: 88, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", background: "linear-gradient(180deg, rgba(22,163,74,0.95), rgba(20,83,45,0.55))", borderRadius: 5, height: `${Math.max(pct * 100, 4)}%`, transition: "height 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 9, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden", gridColumn: isMobile ? "span 1" : "span 2" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>Recent Orders</span>
            <button onClick={() => setTab("orders")} style={{ fontSize: 11, color: "#22c55e", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {loading ? <div style={{ padding: 32, textAlign: "center", color: "var(--sa-muted)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Loading...</div>
            : orders.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>📦 No orders yet. Place a test order from the storefront.</div>
              : orders.slice(0, 8).map((o: any) => (
                <div key={o._id} onClick={() => setViewOrderModal(o)} style={{ padding: "11px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as any).style.background = "var(--sa-row-hover)"}
                  onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--sa-ghost-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "monospace", color: "var(--sa-muted)", flexShrink: 0 }}>
                    #{o._id?.slice(-4).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sa-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{fmt(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>{currency(o.total)}</div>
                    <StatusPill status={o.status} />
                  </div>
                </div>
              ))}
        </div>

        {/* Top products */}
        <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>Top Products</span>
            <button onClick={() => setTab("analytics")} style={{ fontSize: 11, color: "#22c55e", background: "none", border: "none", cursor: "pointer" }}>More →</button>
          </div>
          {topProducts.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: "var(--sa-muted)", fontSize: 12 }}>No sales data yet</div>
            : topProducts.slice(0, 8).map((p: any, i: number) => (
              <div key={p.name} style={{ padding: "10px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10, color: "var(--sa-muted)", width: 14, fontFamily: "monospace" }}>#{i + 1}</span>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--sa-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "var(--sa-muted)" }}>{p.qty} units</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{currency(p.revenue)}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>⚠ Low Stock Alert ({lowStockItems.length} products)</span>
            <button onClick={() => setTab("products")} style={{ marginLeft: "auto", fontSize: 11, color: "#fbbf24", background: "none", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 8, padding: "3px 10px", cursor: "pointer" }}>Manage →</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lowStockItems.map((p: any) => (
              <div key={p._id} style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{p.emoji}</span>{p.name}<span style={{ opacity: 0.6, fontFamily: "monospace" }}>({p.stock} left)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── USERS TAB ────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
    const matchFilter = userFilter === "all" || u.role === userFilter;
    return matchSearch && matchFilter;
  });

  const UsersTab = () => (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--sa-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, phone..."
            style={{ width: "100%", background: "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "9px 12px 9px 32px", color: "var(--sa-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "superadmin", "admin", "delivery", "customer"].map(r => (
            <button key={r} onClick={() => setUserFilter(r)}
              style={{
                padding: "7px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: "1px solid",
                background: userFilter === r ? "rgba(34,197,94,0.2)" : "var(--sa-surface)",
                color: userFilter === r ? "#15803d" : "var(--sa-muted)",
                borderColor: userFilter === r ? "rgba(34,197,94,0.4)" : "var(--sa-input-border)"
              }}>
              {r === "all" ? `All (${users.length})` : ROLE_CFG[r as Role]?.label || r}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button onClick={() => exportCSV(filteredUsers, ["Name", "Email", "Role", "Phone", "Status", "Created"], ["name", "email", "role", "phone", "isActive", "createdAt"], "users")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 10, padding: "8px 14px", color: "var(--sa-muted)", cursor: "pointer", fontSize: 12 }}>
            <Download size={13} />Export
          </button>
          <button onClick={() => setCreateUserModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#14532d,#166534)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 14px rgba(20,83,45,0.35)" }}>
            <UserPlus size={13} />Create User
          </button>
        </div>
      </div>

      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                {["User", "Contact", "Role", "Balance", "Status", "Last Login", "Joined", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Loading users from Convex...</div>
              </td></tr>
                : filteredUsers.length === 0 ? <tr><td colSpan={8} style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👤</div>
                  <div style={{ color: "var(--sa-muted)", fontSize: 14 }}>{search ? "No users matching your search" : "No users found. Run the seed command."}</div>
                </td></tr>
                  : filteredUsers.map((u: any) => (
                    <tr key={u._id} style={{ borderBottom: "1px solid var(--sa-card-border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "var(--sa-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: u.role === "superadmin" ? "linear-gradient(135deg,#14532d,#166534)" : u.role === "admin" ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : u.role === "delivery" ? "linear-gradient(135deg,#c2410c,#f97316)" : "linear-gradient(135deg,#15803d,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sa-text)" }}>{u.name}</div>
                            {u.role === "superadmin" && <div style={{ fontSize: 10, color: "#22c55e" }}>God mode</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 12, color: "var(--sa-muted)" }}>{u.email}</div>
                        <div style={{ fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace" }}>{u.phone || "—"}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><Badge role={u.role} /></td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: (u.balance || 0) > 0 ? "#16a34a" : "var(--sa-muted)" }}>₹{u.balance || 0}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <button onClick={() => u.role !== "superadmin" && toggleUserStatus(u)} disabled={u.role === "superadmin"}
                          style={{ background: u.isActive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: u.isActive ? "#4ade80" : "#f87171", border: `1px solid ${u.isActive ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 600, cursor: u.role === "superadmin" ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          {u.isActive ? <><CheckCircle size={10} />Active</> : <><X size={10} />Suspended</>}
                        </button>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--sa-muted)" }}>{u.lastLogin ? fmt(u.lastLogin) : "Never"}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{fmt(u.createdAt)}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setEditUserModal(u); setEditUserForm({ name: u.name, phone: u.phone || "", role: u.role, isActive: u.isActive, newPassword: "" }); }}
                            style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#60a5fa" }}>
                            <Edit2 size={13} />
                          </button>
                          {u.role !== "superadmin" && <button onClick={() => setDeleteUserModal(u)}
                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#f87171" }}>
                            <Trash2 size={13} />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── ORDERS TAB ───────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.toLowerCase();
    const matchSearch = !q || o.customerName?.toLowerCase().includes(q) || o.customerPhone?.includes(q) || o._id?.toLowerCase().includes(q) || o.deliveryAddress?.toLowerCase().includes(q);
    const matchFilter = orderFilter === "all" || o.status === orderFilter;
    return matchSearch && matchFilter;
  });

  const OrdersTab = () => (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--sa-muted)" }} />
          <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search by name, phone, order ID..."
            style={{ width: "100%", background: "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "9px 12px 9px 32px", color: "var(--sa-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button onClick={() => exportCSV(filteredOrders, ["Order ID", "Customer", "Phone", "Address", "Total", "Payment", "Status", "Date"], ["_id", "customerName", "customerPhone", "deliveryAddress", "total", "paymentMethod", "status", "createdAt"], "orders")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 10, padding: "8px 14px", color: "var(--sa-muted)", cursor: "pointer", fontSize: 12, marginLeft: "auto" }}>
          <Download size={13} />Export CSV
        </button>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {["all", "pending", "confirmed", "preparing", "assigned", "out_for_delivery", "delivered", "cancelled"].map(s => (
          <button key={s} onClick={() => setOrderFilter(s)}
            style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: "1px solid", background: orderFilter === s ? "rgba(34,197,94,0.2)" : "var(--sa-surface)", color: orderFilter === s ? "#15803d" : "var(--sa-muted)", borderColor: orderFilter === s ? "rgba(34,197,94,0.3)" : "var(--sa-input-border)" }}>
            {s === "all" ? `All (${orders.length})` : `${s.replace(/_/g, " ")} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead><tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
              {["Order", "Customer", "Address", "Amount", "Payment", "Status", "Time", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--sa-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Loading...</div>
              </td></tr>
                : filteredOrders.length === 0 ? <tr><td colSpan={8} style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                  <div style={{ color: "var(--sa-muted)", fontSize: 14 }}>No orders found</div>
                </td></tr>
                  : filteredOrders.map((o: any) => (
                    <tr key={o._id} onClick={() => setViewOrderModal(o)} style={{ borderBottom: "1px solid var(--sa-card-border)", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "var(--sa-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--sa-muted)", fontWeight: 600 }}>#{o._id?.slice(-6).toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sa-text)" }}>{o.customerName}</div>
                        <div style={{ fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace" }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--sa-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.deliveryAddress}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>{currency(o.total)}</div>
                        <div style={{ fontSize: 10, color: "var(--sa-muted)" }}>{o.deliveryFee === 0 ? "Free del" : `+₹${o.deliveryFee} del`}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "var(--sa-surface)", border: "1px solid var(--sa-input-border)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace" }}>{o.paymentMethod?.toUpperCase()}</span>
                        <div style={{ fontSize: 10, color: o.paymentStatus === "paid" ? "#4ade80" : "#fbbf24", marginTop: 2 }}>{o.paymentStatus}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}><StatusPill status={o.status} /></td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{fmt(o.createdAt)}</td>
                      <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 4 }}>
                          {!["delivered", "cancelled"].includes(o.status) && <button onClick={() => updateOrderStatus(o._id, o.status === "pending" ? "confirmed" : o.status === "confirmed" ? "preparing" : o.status === "preparing" ? "assigned" : o.status === "assigned" ? "picked_up" : o.status === "picked_up" ? "out_for_delivery" : "delivered")}
                            style={{ background: "rgba(74,222,128,0.1)", border: "none", borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: "#4ade80", fontSize: 11, fontWeight: 600 }}>→ Next</button>}
                          {!["delivered", "cancelled"].includes(o.status) && <button onClick={() => updateOrderStatus(o._id, "cancelled")}
                            style={{ background: "rgba(248,113,113,0.1)", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#f87171", fontSize: 11 }}>✕</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── PRODUCTS TAB ─────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    (p?.name || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const ProductsTab = () => (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--sa-muted)" }} />
          <input
            ref={productSearchInputRef}
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder={`Search ${products.length} products...`}
            style={{ width: "100%", background: "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "9px 12px 9px 32px", color: "var(--sa-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={() => { productSearchFocusedRef.current = true; }}
            onBlur={() => {
              window.setTimeout(() => {
                if (document.activeElement !== productSearchInputRef.current) {
                  productSearchFocusedRef.current = false;
                }
              }, 50);
            }}
          />
        </div>
        <button onClick={() => exportCSV(products, ["Name", "Category", "Price", "Stock", "Active"], ["name", "category", "price", "stock", "isActive"], "products")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 10, padding: "8px 14px", color: "var(--sa-muted)", cursor: "pointer", fontSize: 12 }}>
          <Download size={13} />Export
        </button>
        {selectedProductIds.length > 0 && <>
          <button onClick={() => { void bulkSetProductActive(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 10, padding: "8px 12px", color: "#4ade80", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Activate ({selectedProductIds.length})
          </button>
          <button onClick={() => { void bulkSetProductActive(false); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 10, padding: "8px 12px", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Deactivate
          </button>
          <button onClick={() => setDeleteSelectedProductIds(selectedProductIds)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 10, padding: "8px 12px", color: "#f87171", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Delete ({selectedProductIds.length})
          </button>
        </>}
        <button onClick={() => setCreateProductModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#14532d,#166534)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 14px rgba(20,83,45,0.3)" }}>
          <Plus size={13} />Add Product
        </button>
      </div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead><tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
              <th style={{ padding: "12px 12px", width: 36 }}>
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && filteredProducts.every((p: any) => selectedProductIds.includes(p._id))}
                  onChange={e => setSelectedProductIds(e.target.checked ? filteredProducts.map((p: any) => p._id) : [])}
                  style={{ accentColor: "#16a34a", cursor: "pointer" }}
                />
              </th>
              {["Product", "Category", "Price", "Stock", "Rating", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--sa-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Loading products...</div>
              </td></tr>
                : filteredProducts.length === 0 ? <tr><td colSpan={8} style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
                  <div style={{ color: "var(--sa-muted)", fontSize: 14 }}>No products. Run <code style={{ background: "var(--sa-surface)", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "var(--sa-text)" }}>npx convex run products:seedProducts</code></div>
                </td></tr>
                  : filteredProducts.map((p: any) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid var(--sa-card-border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "var(--sa-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "12px 12px" }}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p._id)}
                          onChange={e => setSelectedProductIds(prev => e.target.checked ? [...prev, p._id] : prev.filter(id => id !== p._id))}
                          style={{ accentColor: "#16a34a", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{p.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sa-text)" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "var(--sa-surface)", border: "1px solid var(--sa-input-border)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "var(--sa-muted)" }}>{p.category}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>₹{p.price}</div>
                        <div style={{ fontSize: 10, color: "var(--sa-muted)", textDecoration: "line-through" }}>₹{p.originalPrice}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: p.stock === 0 ? "#f87171" : p.stock < 10 ? "#fbbf24" : "#4ade80" }}>{p.stock}</span>
                        {p.stock < 10 && p.stock > 0 && <span style={{ fontSize: 9, color: "#fbbf24", marginLeft: 4 }}>⚠LOW</span>}
                        {p.stock === 0 && <span style={{ fontSize: 9, color: "#f87171", marginLeft: 4 }}>⛔OUT</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ color: "#fbbf24", fontSize: 12 }}>★</span>
                          <span style={{ fontSize: 13, color: "var(--sa-text)" }}>{p.rating?.toFixed(1) || "—"}</span>
                          <span style={{ fontSize: 10, color: "var(--sa-muted)" }}>({p.reviews || 0})</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: p.isActive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: p.isActive ? "#4ade80" : "#f87171", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => {
                            setEditProductModal(p);
                            setEditProductForm({ price: String(p.price), stock: String(p.stock), badge: p.badge || "", description: p.description || "", image: p.image || "", isActive: p.isActive });
                          }}
                            style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#60a5fa" }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteProductModal(p)}
                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#f87171" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── DELIVERY TAB ─────────────────────────────────────────────
  const DeliveryTab = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
        {deliveryBoys.length === 0 ? <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 14, padding: 20, color: "var(--sa-muted)", fontSize: 13, gridColumn: "1/-1" }}>
          No delivery partners. Run <code style={{ fontSize: 11 }}>npx convex run auth:seedAdminAndDelivery</code>
        </div>
          : deliveryBoys.map((b: any) => {
            const bOrders = orders.filter((o: any) => o.assignedDeliveryBoyName === b.name);
            const active = bOrders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length;
            const delivered = bOrders.filter((o: any) => o.status === "delivered").length;
            const today = bOrders.filter((o: any) => o.status === "delivered" && Date.now() - o.createdAt < 86400000).length;
            const earnings = delivered * 70;
            return (
              <div key={b._id} style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: 18, transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget as any).style.borderColor = "rgba(34,197,94,0.3)"}
                onMouseLeave={e => (e.currentTarget as any).style.borderColor = "var(--sa-card-border)"}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#14532d,#166534)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>{b.name?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{b.phone || b.email}</div>
                  </div>
                  <span style={{ background: b.isActive ? "rgba(74,222,128,0.1)" : "var(--sa-surface)", color: b.isActive ? "#15803d" : "var(--sa-muted)", fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                    {b.isActive ? "Online" : "Offline"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8 }}>
                  {[["Today", today, "#16a34a"], ["Active", active, "#fbbf24"], ["Total", delivered, "#60a5fa"], ["Earned", `₹${earnings}`, "#4ade80"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ background: "var(--sa-surface)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: c as string }}>{v as any}</div>
                      <div style={{ fontSize: 9, color: "var(--sa-muted)", marginTop: 2 }}>{l as string}</div>
                    </div>
                  ))}
                  <div style={{ background: "var(--sa-surface)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>₹{b.balance || 0}</div>
                    <div style={{ fontSize: 9, color: "var(--sa-muted)", marginTop: 2 }}>Balance</div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Active deliveries table */}
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--sa-card-border)", fontSize: 13, fontWeight: 600, color: "var(--sa-text)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Active Deliveries
          <span style={{ fontSize: 11, color: "var(--sa-muted)" }}>{orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length} in progress</span>
        </div>
        {orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length === 0
          ? <div style={{ padding: 32, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>No active deliveries right now</div>
          : orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).map((o: any) => (
            <div key={o._id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sa-text)" }}>{o.customerName}</div>
                <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{o.deliveryAddress?.split(",").slice(0, 2).join(",")}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <StatusPill status={o.status} />
                {o.assignedDeliveryBoyName && <div style={{ fontSize: 11, color: "var(--sa-muted)", marginTop: 4 }}>🛵 {o.assignedDeliveryBoyName}</div>}
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", marginTop: 2 }}>{currency(o.total)}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  // ── ANALYTICS TAB ────────────────────────────────────────────
  const AnalyticsTab = () => {
    const byStatus = Object.entries(STATUS_CFG).map(([k]) => ({ status: k, count: orders.filter((o: any) => o.status === k).length })).filter(x => x.count > 0);
    const byPayment = [
      { method: "COD", count: orders.filter((o: any) => o.paymentMethod === "cod").length, color: "#fbbf24" },
      { method: "UPI", count: orders.filter((o: any) => o.paymentMethod === "upi").length, color: "#60a5fa" },
      { method: "Online", count: orders.filter((o: any) => o.paymentMethod === "online").length, color: "#a78bfa" },
    ].filter(x => x.count > 0);
    const maxCount = Math.max(...byStatus.map(s => s.count), 1);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          {[
            { label: "Total Revenue", value: currency(totalRevenue), icon: DollarSign, color: "#4ade80" },
            { label: "Avg Order Value", value: currency(orders.length ? Math.round(totalRevenue / Math.max(orders.filter((o: any) => o.status === "delivered").length, 1)) : 0), icon: TrendingUp, color: "#60a5fa" },
            { label: "Delivery Rate", value: `${orders.length ? Math.round(orders.filter((o: any) => o.status === "delivered").length / orders.length * 100) : 0}%`, icon: CheckCircle, color: "#4ade80" },
            { label: "Cancellation Rate", value: `${orders.length ? Math.round(orders.filter((o: any) => o.status === "cancelled").length / orders.length * 100) : 0}%`, icon: X, color: "#f87171" },
            { label: "Total Customers", value: customerCount, icon: Users, color: "#22c55e" },
            { label: "Products in Stock", value: products.filter(p => p.stock > 0 && p.isActive).length, icon: Package, color: "#fb923c" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ width: 36, height: 36, background: `${color}15`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--sa-text)", letterSpacing: "-0.3px" }}>{value}</div>
              <div style={{ fontSize: 12, color: "var(--sa-muted)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {/* Order status breakdown */}
          <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sa-text)", marginBottom: 16 }}>Orders by Status</div>
            {byStatus.map(({ status, count }) => {
              const c = STATUS_CFG[status];
              return (
                <div key={status} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--sa-muted)", textTransform: "capitalize" }}>{status.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{count} ({Math.round(count / orders.length * 100)}%)</span>
                  </div>
                  <div style={{ height: 6, background: "var(--sa-track)", borderRadius: 20 }}>
                    <div style={{ height: "100%", background: c.color, borderRadius: 20, width: `${count / maxCount * 100}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment methods */}
          <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sa-text)", marginBottom: 16 }}>Payment Methods</div>
            {byPayment.map(({ method, count, color }) => (
              <div key={method} style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: `${color}15`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16 }}>{method === "COD" ? "💵" : method === "UPI" ? "📱" : "💳"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--sa-text)", fontWeight: 500 }}>{method}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--sa-track)", borderRadius: 20 }}>
                    <div style={{ height: "100%", background: color, borderRadius: 20, width: `${count / Math.max(orders.length, 1) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: "14px", background: "var(--sa-surface)", borderRadius: 12 }}>
              <div style={{ fontSize: 12, color: "var(--sa-muted)", marginBottom: 8 }}>User Roles Distribution</div>
              {[["superadmin", 1, "#22c55e"], ["admin", adminCount - 1, "#60a5fa"], ["delivery", deliveryCount, "#fb923c"], ["customer", customerCount, "#4ade80"]].map(([role, count, color]) => (
                <div key={role as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--sa-muted)", textTransform: "capitalize" }}>{role as string}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: "var(--sa-track)", borderRadius: 20 }}>
                      <div style={{ height: "100%", background: color as string, borderRadius: 20, width: `${Math.min((count as number) / Math.max(users.length, 1) * 100, 100)}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: color as string, minWidth: 20, textAlign: "right" }}>{count as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products table */}
        <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sa-text)" }}>Top Selling Products (All Time)</span>
            <button onClick={() => exportCSV(topProducts, ["Product", "Qty Sold", "Revenue"], ["name", "qty", "revenue"], "top-products")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 8, padding: "6px 12px", color: "var(--sa-muted)", cursor: "pointer", fontSize: 11 }}>
              <Download size={11} />Export
            </button>
          </div>
          {topProducts.length === 0 ? <div style={{ padding: 32, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>No sales data yet</div>
            : topProducts.map((p: any, i: number) => (
              <div key={p.name} style={{ padding: "12px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace", width: 20 }}>#{i + 1}</span>
                <span style={{ fontSize: 22 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--sa-text)", fontWeight: 500 }}>{p.name}</div>
                  <div style={{ height: 4, background: "var(--sa-track)", borderRadius: 20, marginTop: 5, width: "100%" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#14532d,#16a34a)", borderRadius: 20, width: `${(p.revenue / Math.max(...topProducts.map((x: any) => x.revenue), 1) * 100)}%` }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>{currency(p.revenue)}</div>
                  <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{p.qty} units</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // ── PARTNER APPLICATIONS TAB ─────────────────────────────────
  const PartnersTab = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--sa-muted)" }}>
          Pending applications · {partnerApplications.length + deliveryPartnerApplications.length} in queue
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sa-text)", marginBottom: 10 }}>Franchise / admin onboarding (long form)</div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                {["Applicant", "Phone", "Email", "Submitted", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--sa-text)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Loading…</div>
              </td></tr>
                : partnerApplications.length === 0 ? <tr><td colSpan={5} style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                  <div style={{ color: "var(--sa-muted)", fontSize: 14 }}>No pending partner applications</div>
                </td></tr>
                  : partnerApplications.map((app: any) => (
                    <tr key={app._id} style={{ borderBottom: "1px solid var(--sa-card-border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--sa-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>{app.name}</div>
                        <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{app.cityApplying}</div>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--sa-text)" }}>{app.phone}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--sa-muted)" }}>{app.email}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{fmtDate(app.submittedAt)}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => setPartnerDetailModal(app)}
                            style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>
                            Review
                          </button>
                          <button onClick={() => approvePartnerApplication(app._id)} disabled={busy}
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "6px 12px", cursor: busy ? "not-allowed" : "pointer", color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                            Approve
                          </button>
                          <button onClick={() => rejectPartnerApplication(app._id)} disabled={busy}
                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, padding: "6px 12px", cursor: busy ? "not-allowed" : "pointer", color: "#f87171", fontSize: 12, fontWeight: 600 }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sa-text)", marginBottom: 10, marginTop: 28 }}>Delivery riders (short form — phone + OTP after approval)</div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                {["Name", "Phone", "City", "Submitted", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--sa-text)", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Loading…</div>
              </td></tr>
                : deliveryPartnerApplications.length === 0 ? <tr><td colSpan={5} style={{ padding: 36, textAlign: "center" }}>
                  <div style={{ color: "var(--sa-muted)", fontSize: 14 }}>No pending delivery rider applications</div>
                </td></tr>
                  : deliveryPartnerApplications.map((app: any) => (
                    <tr key={app._id} style={{ borderBottom: "1px solid var(--sa-card-border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--sa-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>{app.name}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--sa-text)" }}>{app.phone}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--sa-muted)" }}>{app.city}</td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{fmtDate(app.submittedAt)}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => setDeliveryPartnerDetailModal(app)}
                            style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>
                            Review
                          </button>
                          <button onClick={() => approveDeliveryPartnerApp(app._id)} disabled={busy}
                            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "6px 12px", cursor: busy ? "not-allowed" : "pointer", color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
                            Approve
                          </button>
                          <button onClick={() => rejectDeliveryPartnerApp(app._id)} disabled={busy}
                            style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, padding: "6px 12px", cursor: busy ? "not-allowed" : "pointer", color: "#f87171", fontSize: 12, fontWeight: 600 }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sa-text)", marginBottom: 10, marginTop: 32 }}>
        Franchise — archive (approved &amp; rejected)
      </div>
      <div style={{ fontSize: 12, color: "var(--sa-muted)", marginBottom: 10 }}>
        {processedFranchiseApps.length} record(s). Newest decision first.
      </div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                {["Status", "Applicant", "Phone", "Email", "Submitted", "Reviewed", "Details"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--sa-text)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--sa-muted)" }}>…</td></tr>
                : processedFranchiseApps.length === 0 ? <tr><td colSpan={7} style={{ padding: 36, textAlign: "center", color: "var(--sa-muted)", fontSize: 14 }}>
                  No processed franchise applications yet
                </td></tr>
                  : processedFranchiseApps.map((app: any) => (
                    <tr key={app._id} style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                          background: app.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.12)",
                          color: app.status === "approved" ? "#4ade80" : "#f87171",
                        }}>{app.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>{app.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--sa-text)" }}>{app.phone}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--sa-muted)" }}>{app.email}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{fmtDate(app.submittedAt)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{app.reviewedAt ? fmtDate(app.reviewedAt) : "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button type="button" onClick={() => setPartnerDetailModal(app)}
                          style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--sa-text)", marginBottom: 10, marginTop: 28 }}>
        Delivery riders — archive (approved &amp; rejected)
      </div>
      <div style={{ fontSize: 12, color: "var(--sa-muted)", marginBottom: 10 }}>
        {processedRiderApps.length} record(s). Newest decision first.
      </div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                {["Status", "Name", "Phone", "City", "Submitted", "Reviewed", "Details"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--sa-text)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--sa-muted)" }}>…</td></tr>
                : processedRiderApps.length === 0 ? <tr><td colSpan={7} style={{ padding: 36, textAlign: "center", color: "var(--sa-muted)", fontSize: 14 }}>
                  No processed rider applications yet
                </td></tr>
                  : processedRiderApps.map((app: any) => (
                    <tr key={app._id} style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                          background: app.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(248,113,113,0.12)",
                          color: app.status === "approved" ? "#4ade80" : "#f87171",
                        }}>{app.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--sa-text)" }}>{app.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", color: "var(--sa-text)" }}>{app.phone}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--sa-muted)" }}>{app.city}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{fmtDate(app.submittedAt)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--sa-muted)", whiteSpace: "nowrap" }}>{app.reviewedAt ? fmtDate(app.reviewedAt) : "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button type="button" onClick={() => setDeliveryPartnerDetailModal(app)}
                          style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── LOGS TAB ─────────────────────────────────────────────────
  const LogsTab = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--sa-muted)" }}>{activityLog.length} log entries</div>
        <button onClick={() => exportCSV(activityLog, ["Time", "User", "Action", "Target", "Details"], ["timestamp", "userName", "action", "target", "details"], "activity-log")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 10, padding: "8px 14px", color: "var(--sa-muted)", cursor: "pointer", fontSize: 12 }}>
          <Download size={13} />Export Logs
        </button>
      </div>
      <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", gap: 10, alignItems: "center" }}>
          <Terminal size={14} color="#16a34a" />
          <span style={{ fontSize: 12, color: "#22c55e", fontFamily: "monospace" }}>SYSTEM_LOG · Showing last {activityLog.length} events</span>
        </div>
        {activityLog.length === 0 ? <div style={{ padding: 48, textAlign: "center" }}><div style={{ fontSize: 36, marginBottom: 10 }}>📋</div><div style={{ color: "var(--sa-muted)", fontSize: 14 }}>No activity recorded yet</div></div>
          : activityLog.map((log: any, i: number) => (
            <div key={i} style={{ padding: "11px 18px", borderBottom: "1px solid var(--sa-card-border)", display: "flex", gap: 12, alignItems: "flex-start", fontFamily: "monospace", fontSize: 12 }}>
              <span style={{ color: "var(--sa-muted)", flexShrink: 0, fontSize: 10, marginTop: 1 }}>{fmtDate(log.timestamp)}</span>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>{log.userName}</span>
                <span style={{ color: "var(--sa-muted)" }}> · </span>
                <span style={{ color: "#4ade80" }}>{log.action}</span>
                {log.target && <><span style={{ color: "var(--sa-muted)" }}> → </span><span style={{ color: "#60a5fa" }}>{log.target}</span></>}
                {log.details && <div style={{ color: "var(--sa-muted)", marginTop: 2, fontSize: 11 }}>{log.details}</div>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );


  // ── PAYOUTS TAB ─────────────────────────────────────────────
  const PayoutsTab = () => {
    const pending = payouts.filter((p: any) => p.status === "pending");
    const history = payouts.filter((p: any) => p.status !== "pending");

    const processPayout = async (pId: string, status: "processed" | "rejected") => {
      try {
        setBusy(true);
        await cm("payouts:processPayout", { payoutId: pId, status, adminId: (saUser as any)._id || "SA" });
        showToast(`Payout ${status === "processed" ? "approved" : "rejected"} successfully`);
        void loadAll();
      } catch (e: any) {
        showToast(`Error: ${e.message}`, "err");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--sa-text)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
            <IndianRupee size={18} color="#16a34a" /> Pending Payout Requests
          </h3>
          {pending.length === 0 ? (
            <div style={{ color: "var(--sa-muted)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No pending requests.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pending.map((p: any) => (
                <div key={p._id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, background: "var(--sa-surface)", border: "1px solid var(--sa-card-border)", borderRadius: 14, padding: "14px 18px" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sa-text)" }}>{p.userName}</div>
                    <div style={{ fontSize: 11, color: "var(--sa-muted)", background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 6, display: "inline-block", marginTop: 4 }}>{p.method.toUpperCase()} — {p.details}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>₹{p.amount}</div>
                    <div style={{ fontSize: 10, color: "var(--sa-muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button disabled={busy} onClick={() => processPayout(p._id, "processed")} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Approve</button>
                    <button disabled={busy} onClick={() => processPayout(p._id, "rejected")} style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: "var(--sa-card-bg)", border: "1px solid var(--sa-card-border)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--sa-muted)", margin: "0 0 16px 0" }}>Payout History</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--sa-card-border)" }}>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--sa-muted)", fontWeight: 500 }}>Partner</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--sa-muted)", fontWeight: 500 }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--sa-muted)", fontWeight: 500 }}>Method</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--sa-muted)", fontWeight: 500 }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--sa-muted)", fontWeight: 500 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p: any) => (
                  <tr key={p._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "12px 8px", color: "var(--sa-text)" }}>{p.userName}</td>
                    <td style={{ padding: "12px 8px", fontWeight: 700, color: "var(--sa-text)" }}>₹{p.amount}</td>
                    <td style={{ padding: "12px 8px", color: "var(--sa-muted)", fontSize: 11 }}>{p.method}</td>
                    <td style={{ padding: "12px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: p.status === "processed" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.status === "processed" ? "#22c55e" : "#ef4444" }}>{p.status.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "12px 8px", color: "var(--sa-muted)", fontSize: 11 }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTab = () => {
    if (tab === "dashboard") return <DashboardTab />;
    if (tab === "users") return <UsersTab />;
    if (tab === "applications") return <PartnersTab />;
    if (tab === "orders") return <OrdersTab />;
    if (tab === "products") return <ProductsTab />;
    if (tab === "delivery") return <DeliveryTab />;
    if (tab === "payouts") return <PayoutsTab />;
    if (tab === "analytics") return <AnalyticsTab />;
    if (tab === "logs") return <LogsTab />;
    return <DashboardTab />;
  };

  const topBtnStyle: React.CSSProperties = {
    background: "var(--sa-ghost-bg)",
    border: "1px solid var(--sa-ghost-border)",
    borderRadius: 8,
    color: "var(--sa-text)",
    cursor: "pointer",
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
  };

  const saBrandLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, overflow: "hidden", flex: isMobile ? "0 0 auto" : 1 }}>
      <button type="button" onClick={() => { setNotifOpen(false); setProfileOpen(false); setSidebarOpen(!sidebarOpen); }} style={topBtnStyle}>
        {isMobile ? <Menu size={18} /> : <LayoutDashboard size={18} />}
      </button>
      <div style={{ minWidth: 0 }}>
        {!isMobile && <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--sa-text)", margin: 0 }}>{NAV.find(n => n.id === tab)?.label}</h1>}
        {!isMobile && <div style={{ fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace" }}>{new Date().toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
      </div>
    </div>
  );

  const saBrandRight = (
    <>
      <button type="button" onClick={toggleTheme} title={isDarkMode ? "Light mode" : "Dark mode"} style={topBtnStyle}>
        {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
      </button>
      {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "4px 10px" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px #16a34a" }} />
        <span style={{ fontSize: 10, color: "#15803d", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>LIVE</span>
      </div>}
      <button type="button" onClick={loadAll} style={{ ...topBtnStyle, gap: 6, fontSize: 12 }}>
        <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
      </button>
      <div style={{ position: "relative" }}>
        <button type="button" onClick={() => setNotifOpen(!notifOpen)} style={{ ...topBtnStyle, position: "relative" }}>
          <Bell size={15} />
          {pendingOrders.length > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, background: "#ef4444", borderRadius: "50%", fontSize: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{pendingOrders.length}</span>}
        </button>
        {notifOpen && (
          <div style={{
            position: isMobile ? "fixed" : "absolute",
            right: isMobile ? 10 : 0,
            top: isMobile ? 88 : "calc(100% + 8px)",
            width: isMobile ? "calc(100vw - 20px)" : 300,
            background: "var(--sa-modal-bg)",
            border: "1px solid var(--sa-modal-border)",
            borderRadius: 14,
            overflow: "hidden",
            zIndex: 180,
            boxShadow: "var(--sa-modal-shadow)"
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--sa-card-border)", fontSize: 13, fontWeight: 600, color: "var(--sa-text)", display: "flex", justifyContent: "space-between" }}>
              Notifications <span style={{ fontSize: 11, color: "#22c55e" }}>{pendingOrders.length + payouts.filter((p:any)=>p.status==="pending").length} pending</span>
            </div>
            {pendingOrders.length === 0
              ? <div style={{ padding: 20, textAlign: "center", color: "var(--sa-muted)", fontSize: 13 }}>All caught up!</div>
              : pendingOrders.slice(0, 5).map((o: any) => (
                <div key={o._id} onClick={() => { setViewOrderModal(o); setNotifOpen(false); }}
                  style={{ padding: "11px 16px", borderBottom: "1px solid var(--sa-card-border)", cursor: "pointer", display: "flex", gap: 10 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--sa-row-hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbf24", marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: "var(--sa-text)" }}>{o.customerName} · <span style={{ color: "#4ade80" }}>₹{o.total}</span></div>
                    <div style={{ fontSize: 11, color: "var(--sa-muted)" }}>{fmt(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      {!isMobile && <a href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"} target="_blank" rel="noreferrer"
        style={{ ...topBtnStyle, padding: "6px 12px", fontSize: 12, textDecoration: "none", gap: 6 }}>
        <Globe size={13} />Admin
      </a>}
      <div style={{ position: "relative" }}>
        <button type="button" onClick={() => { setNotifOpen(false); setProfileOpen(!profileOpen); }}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
          <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#14532d,#166534)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
            {(saUser?.name || "S").charAt(0)}
          </div>
          {!isMobile && <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sa-text)" }}>{saUser?.name || "Super Admin"}</div>
            <div style={{ fontSize: 9, color: "var(--sa-muted)" }}>superadmin</div>
          </div>}
          <ChevronDown size={11} style={{ color: "var(--sa-muted)" }} />
        </button>
        {profileOpen && (
          <div style={{
            position: isMobile ? "fixed" : "absolute",
            right: isMobile ? 10 : 0,
            top: isMobile ? 88 : "calc(100% + 8px)",
            width: isMobile ? 220 : 248,
            background: "var(--sa-modal-bg)",
            border: "1px solid var(--sa-modal-border)",
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 190,
            boxShadow: "var(--sa-modal-shadow)"
          }}>
            <div style={{ padding: isMobile ? "12px 14px" : "14px 16px", borderBottom: "1px solid var(--sa-card-border)" }}>
              <div style={{ fontSize: 13, color: "var(--sa-text)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{saUser?.name || "Super Admin"}</div>
              <div style={{ fontSize: 11, color: "var(--sa-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{saUser?.email || "superadmin@vegfru.com"}</div>
              <div style={{ marginTop: 8, display: "inline-flex" }}>
                <Badge role="superadmin" />
              </div>
            </div>
            {!isMobile && (
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "transparent", border: "none", color: "var(--sa-text)", fontSize: 12, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--sa-row-hover)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                Close menu
              </button>
            )}
            {isMobile && (
              <button type="button" onClick={() => setProfileOpen(false)} style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", borderTop: "1px solid var(--sa-card-border)", color: "var(--sa-text)", fontSize: 12, cursor: "pointer" }}>
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  // ── Theme tokens (light + dark readable contrast) ────────────
  const saTheme: React.CSSProperties = {
    ["--sa-bg" as any]: isDarkMode ? "#060810" : "#FEFAE0",
    ["--sa-sidebar" as any]: isDarkMode ? "#0d1117" : "#fffef4",
    ["--sa-topbar" as any]: isDarkMode ? "#0d1117" : "#FEFAE0",
    ["--sa-panel-border" as any]: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,101,52,0.12)",
    ["--sa-text" as any]: isDarkMode ? "#f1f5f9" : "#0f172a",
    ["--sa-muted" as any]: isDarkMode ? "#94a3b8" : "#475569",
    ["--sa-card-bg" as any]: isDarkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
    ["--sa-card-border" as any]: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(22,101,52,0.12)",
    ["--sa-surface" as any]: isDarkMode ? "rgba(255,255,255,0.06)" : "#f8faf2",
    ["--sa-input-bg" as any]: isDarkMode ? "rgba(255,255,255,0.06)" : "#ffffff",
    ["--sa-input-border" as any]: isDarkMode ? "rgba(255,255,255,0.14)" : "#cbd5e1",
    ["--sa-input-text" as any]: isDarkMode ? "#f1f5f9" : "#0f172a",
    ["--sa-modal-bg" as any]: isDarkMode ? "#0d1117" : "#ffffff",
    ["--sa-modal-border" as any]: isDarkMode ? "rgba(34,197,94,0.25)" : "rgba(22,101,52,0.16)",
    ["--sa-modal-shadow" as any]: isDarkMode ? "0 25px 80px rgba(0,0,0,0.75)" : "0 25px 60px rgba(15,23,42,0.12)",
    ["--sa-overlay" as any]: isDarkMode ? "rgba(0,0,0,0.82)" : "rgba(15,23,42,0.45)",
    ["--sa-row-hover" as any]: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(22,101,52,0.05)",
    ["--sa-ghost-bg" as any]: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(22,101,52,0.08)",
    ["--sa-ghost-border" as any]: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(22,101,52,0.2)",
    ["--sa-track" as any]: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
    ["--sa-subtle" as any]: isDarkMode ? "rgba(255,255,255,0.65)" : "#64748b",
  };

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div
      data-sa-theme={isDarkMode ? "dark" : "light"}
      style={{
        ...saTheme,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--sa-bg)",
        color: "var(--sa-text)",
        fontFamily: "'DM Sans',system-ui,sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.25s ease-out} *{box-sizing:border-box}`}</style>

      <div style={{ flexShrink: 0, zIndex: 60, borderBottom: "1px solid var(--sa-panel-border)", background: "var(--sa-topbar)" }}>
        <div style={{ background: isDarkMode ? "#14532d" : "#166534", color: "#dcfce7", fontSize: 11, padding: "4px 12px", textAlign: "center", fontFamily: "monospace", letterSpacing: 0.4 }}>
          Super Admin Control Center
        </div>
        <div style={{ width: "100%", padding: isMobile ? "8px 10px" : "10px 8px" }}>
          {isMobile ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <img src="/images/Vegfru.png" alt="VegFru Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sa-text)", letterSpacing: "-0.3px" }}>Veg<span style={{ color: "#16a34a" }}>Fru</span></div>
                  <div style={{ fontSize: 9, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}>Super Admin</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflowX: "auto", padding: "0 4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>{saBrandRight}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                {saBrandLeft}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                  <img src="/images/Vegfru.png" alt="VegFru Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--sa-text)", letterSpacing: "-0.3px" }}>Veg<span style={{ color: "#16a34a" }}>Fru</span></div>
                  <div style={{ fontSize: 9, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}>Super Admin</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                {saBrandLeft}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
                {saBrandRight}
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobile && (profileOpen || notifOpen) && (
        <button
          type="button"
          onClick={() => { setProfileOpen(false); setNotifOpen(false); }}
          aria-label="Close popovers"
          style={{ position: "fixed", inset: 0, background: "transparent", border: "none", zIndex: 170, cursor: "default" }}
        />
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Sidebar />
        {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 110 }} />}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <main style={{ flex: 1, overflow: "auto", padding: isMobile ? 12 : 24 }}>
            <div className="fade-in" key={tab}>{renderTab()}</div>
          </main>
        </div>
      </div>

      {/* Toast */}
      {toast.msg && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toast.type === "ok" ? "linear-gradient(135deg,#14532d,#166534)" : "#b91c1c", color: "#fff", padding: "11px 24px", borderRadius: 14, fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
        {toast.type === "ok" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}{toast.msg}
      </div>}

      {/* View Order Modal */}
      {viewOrderModal && <Modal title={`Order #${viewOrderModal._id?.slice(-8).toUpperCase()}`} subtitle={`Placed ${fmtDate(viewOrderModal.createdAt)}`} onClose={() => setViewOrderModal(null)} width={560}>
        <div style={{ marginBottom: 14 }}><StatusPill status={viewOrderModal.status} /></div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[["Customer", viewOrderModal.customerName], ["Phone", viewOrderModal.customerPhone], ["Payment", viewOrderModal.paymentMethod?.toUpperCase()], ["Pay Status", viewOrderModal.paymentStatus], ["Total", currency(viewOrderModal.total)], ["Subtotal", currency(viewOrderModal.subtotal)]].map(([k, v]) => (
            <div key={k} style={{ background: "var(--sa-surface)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sa-text)" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--sa-surface)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", marginBottom: 4 }}>DELIVERY ADDRESS</div>
          <div style={{ fontSize: 13, color: "var(--sa-text)" }}>{viewOrderModal.deliveryAddress}</div>
        </div>
        {viewOrderModal.assignedDeliveryBoyName && <div style={{ background: "rgba(74,222,128,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", marginBottom: 4 }}>DELIVERY BOY</div>
          <div style={{ fontSize: 13, color: "#4ade80" }}>🛵 {viewOrderModal.assignedDeliveryBoyName}</div>
        </div>}
        {!["delivered", "cancelled"].includes(viewOrderModal.status) && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Force Status Change</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["confirmed", "preparing", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"].filter(s => s !== viewOrderModal.status).map(s => (
                <button key={s} onClick={() => { updateOrderStatus(viewOrderModal._id, s); setViewOrderModal(null); }}
                  style={{ padding: "6px 12px", borderRadius: 9, fontSize: 11, cursor: "pointer", border: "none", fontWeight: 500, background: s === "cancelled" ? "rgba(248,113,113,0.15)" : "rgba(34,197,94,0.12)", color: s === "cancelled" ? "#f87171" : "#22c55e" }}>
                  → {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>}

      {/* Create User Modal */}
      {createUserModal && <Modal title="Create New User" subtitle="All fields marked * are required" onClose={() => setCreateUserModal(false)}>
        <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#22c55e", display: "flex", gap: 8, alignItems: "center" }}>
          <ShieldCheck size={13} /> Superadmin action — creates real account in Convex DB
        </div>
        <Field label="Full Name" value={userForm.name} onChange={(v: string) => setUserForm(f => ({ ...f, name: v }))} placeholder="Ravi Kumar" required />
        <Field label="Email" value={userForm.email} onChange={(v: string) => setUserForm(f => ({ ...f, email: v }))} type="email" placeholder="ravi@vegfru.com" required />
        <Field label="Password" value={userForm.password} onChange={(v: string) => setUserForm(f => ({ ...f, password: v }))} type="password" placeholder="Min 6 characters" required />
        <Field label="Phone" value={userForm.phone} onChange={(v: string) => setUserForm(f => ({ ...f, phone: v }))} placeholder="9876543210" />
        <Select label="Role" value={userForm.role} onChange={(v: string) => setUserForm(f => ({ ...f, role: v }))}
          options={[{ value: "delivery", label: "Delivery Boy" }, { value: "admin", label: "Admin" }, { value: "customer", label: "Customer" }]} />
        <PrimaryBtn label="Create Account" loading={busy} onClick={createUser} icon={UserPlus} />
      </Modal>}

      {/* Edit User Modal */}
      {editUserModal && <Modal title={`Edit — ${editUserModal.name}`} subtitle={editUserModal.email} onClose={() => setEditUserModal(null)}>
        <Field label="Full Name" value={editUserForm.name} onChange={(v: string) => setEditUserForm(f => ({ ...f, name: v }))} />
        <Field label="Phone" value={editUserForm.phone} onChange={(v: string) => setEditUserForm(f => ({ ...f, phone: v }))} />
        {editUserModal.role !== "superadmin" && <Select label="Role" value={editUserForm.role} onChange={(v: string) => setEditUserForm(f => ({ ...f, role: v }))}
          options={[{ value: "customer", label: "Customer" }, { value: "delivery", label: "Delivery" }, { value: "admin", label: "Admin" }]} />}
        <Field label="New Password (leave blank to keep)" value={editUserForm.newPassword} onChange={(v: string) => setEditUserForm(f => ({ ...f, newPassword: v }))} type="password" placeholder="Min 6 characters" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "var(--sa-surface)", borderRadius: 10, padding: "12px 14px" }}>
          <input type="checkbox" id="active" checked={editUserForm.isActive} onChange={e => setEditUserForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: "#16a34a", width: 16, height: 16 }} />
          <label htmlFor="active" style={{ fontSize: 13, color: "var(--sa-text)", cursor: "pointer" }}>Account Active</label>
        </div>
        <PrimaryBtn label="Save Changes" loading={busy} onClick={saveEditUser} icon={CheckCircle} />
      </Modal>}

      {/* Delete User Confirm Modal */}
      {deleteUserModal && <Modal title="Delete User?" subtitle="This action is permanent and cannot be undone" onClose={() => setDeleteUserModal(null)} width={440}>
        <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#14532d,#166534)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>
              {deleteUserModal.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sa-text)" }}>{deleteUserModal.name}</div>
              <div style={{ fontSize: 12, color: "var(--sa-muted)" }}>{deleteUserModal.email}</div>
              <Badge role={deleteUserModal.role} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleteUserModal(null)} style={{ flex: 1, background: "var(--sa-ghost-bg)", color: "var(--sa-text)", border: "1px solid var(--sa-input-border)", borderRadius: 11, padding: "11px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmDeleteUser} disabled={busy} style={{ flex: 2, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 11, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={15} />}
            {busy ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </Modal>}

      {deleteProductModal && <Modal title="Delete Product?" subtitle="This action is permanent and cannot be undone" onClose={() => setDeleteProductModal(null)} width={440}>
        <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#14532d,#166534)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {deleteProductModal.emoji || "📦"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--sa-text)" }}>{deleteProductModal.name}</div>
              <div style={{ fontSize: 12, color: "var(--sa-muted)" }}>{deleteProductModal.category || "product"} · ₹{deleteProductModal.price}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleteProductModal(null)} style={{ flex: 1, background: "var(--sa-ghost-bg)", color: "var(--sa-text)", border: "1px solid var(--sa-input-border)", borderRadius: 11, padding: "11px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmDeleteProduct} disabled={busy} style={{ flex: 2, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 11, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={15} />}
            {busy ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </Modal>}

      {/* Delete Selected Products Confirm Modal */}
      {deleteSelectedProductIds && deleteSelectedProductIds.length > 0 && (
        <Modal title="Delete Selected Products?" subtitle="This action is permanent and cannot be undone" onClose={() => setDeleteSelectedProductIds(null)} width={440}>
          <div style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            You are deleting <b>{deleteSelectedProductIds.length}</b> product(s).
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setDeleteSelectedProductIds(null)} style={{ flex: 1, background: "var(--sa-ghost-bg)", color: "var(--sa-text)", border: "1px solid var(--sa-input-border)", borderRadius: 11, padding: "11px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmDeleteSelectedProducts} disabled={busy} style={{ flex: 2, background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 11, padding: "11px", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {busy ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={15} />}
              {busy ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </Modal>
      )}

      {/* Create Product Modal */}
      {createProductModal && <Modal title="Add New Product" subtitle="Product will be added to live catalog" onClose={() => setCreateProductModal(false)}>
        <Field label="Product Name" value={productForm.name} onChange={(v: string) => setProductForm(f => ({ ...f, name: v }))} placeholder="Cherry Tomatoes" required />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          <Field label="Emoji" value={productForm.emoji} onChange={(v: string) => setProductForm(f => ({ ...f, emoji: v }))} placeholder="🥬" />
          <Field label="Unit" value={productForm.unit} onChange={(v: string) => setProductForm(f => ({ ...f, unit: v }))} placeholder="500g" />
          <Field label="Price (₹)" value={productForm.price} onChange={(v: string) => setProductForm(f => ({ ...f, price: v }))} type="number" placeholder="49" required />
          <Field label="Original Price (₹)" value={productForm.originalPrice} onChange={(v: string) => setProductForm(f => ({ ...f, originalPrice: v }))} type="number" placeholder="65" />
          <Field label="Stock Qty" value={productForm.stock} onChange={(v: string) => setProductForm(f => ({ ...f, stock: v }))} type="number" placeholder="50" />
          <Field label="Tag" value={productForm.tag} onChange={(v: string) => setProductForm(f => ({ ...f, tag: v }))} placeholder="Organic" />
        </div>
        <Select label="Category" value={productForm.category} onChange={(v: string) => setProductForm(f => ({ ...f, category: v }))}
          options={["vegetables", "fruits", "herbs", "exotic", "seasonal", "leafy", "berries", "citrus", "root"]} />
        <Field label="Description" value={productForm.description} onChange={(v: string) => setProductForm(f => ({ ...f, description: v }))} placeholder="Short product description" />
        <Field label="Badge (optional)" value={productForm.badge} onChange={(v: string) => setProductForm(f => ({ ...f, badge: v }))} placeholder="BESTSELLER / SEASONAL / NEW" />
        <Field label="Image URL (optional)" value={productForm.image} onChange={(v: string) => setProductForm(f => ({ ...f, image: v }))} placeholder="https://example.com/product.jpg" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>
            Upload Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => { void onProductImageFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }}
            style={{ width: "100%", background: "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "10px 12px", color: "var(--sa-input-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "var(--sa-muted)", marginTop: 4 }}>
            You can either paste an image URL or upload an image file.
          </div>
        </div>
        <PrimaryBtn label="Add to Live Catalog" loading={busy} onClick={createProduct} icon={Plus} />
      </Modal>}

      {/* Edit Product Modal */}
      {editProductModal && <Modal title={`Edit — ${editProductModal.name}`} subtitle={`${editProductModal.emoji} · ${editProductModal.category}`} onClose={() => setEditProductModal(null)}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          <Field label="Price (₹)" value={editProductForm.price} onChange={(v: string) => setEditProductForm(f => ({ ...f, price: v }))} type="number" />
          <Field label="Stock Qty" value={editProductForm.stock} onChange={(v: string) => setEditProductForm(f => ({ ...f, stock: v }))} type="number" />
        </div>
        <Field label="Badge" value={editProductForm.badge} onChange={(v: string) => setEditProductForm(f => ({ ...f, badge: v }))} placeholder="BESTSELLER / SEASONAL..." />
        <Field label="Description" value={editProductForm.description} onChange={(v: string) => setEditProductForm(f => ({ ...f, description: v }))} />
        <Field label="Image URL (optional)" value={editProductForm.image} onChange={(v: string) => setEditProductForm(f => ({ ...f, image: v }))} placeholder="https://example.com/product.jpg" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "var(--sa-muted)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>
            Replace Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => { void onEditProductImageFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }}
            style={{ width: "100%", background: "var(--sa-input-bg)", border: "1px solid var(--sa-input-border)", borderRadius: 10, padding: "10px 12px", color: "var(--sa-input-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "var(--sa-muted)", marginTop: 4 }}>
            You can either paste an image URL or upload an image file.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "var(--sa-surface)", borderRadius: 10, padding: "12px 14px" }}>
          <input type="checkbox" id="pactive" checked={editProductForm.isActive} onChange={e => setEditProductForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: "#16a34a", width: 16, height: 16 }} />
          <label htmlFor="pactive" style={{ fontSize: 13, color: "var(--sa-text)", cursor: "pointer" }}>Product Active (visible in store)</label>
        </div>
        <PrimaryBtn label="Save Changes" loading={busy} onClick={saveEditProduct} icon={CheckCircle} />
      </Modal>}

      {partnerDetailModal && <Modal title="Partner application" subtitle={partnerDetailModal.email} onClose={() => setPartnerDetailModal(null)} width={640}>
        {partnerDetailModal.status && partnerDetailModal.status !== "pending" && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "var(--sa-surface)", border: "1px solid var(--sa-card-border)", fontSize: 12, color: "var(--sa-text)" }}>
            <strong style={{ textTransform: "uppercase", letterSpacing: 1 }}>{partnerDetailModal.status}</strong>
            {partnerDetailModal.reviewedAt && <span style={{ color: "var(--sa-muted)", marginLeft: 8 }}>· Reviewed {fmtDate(partnerDetailModal.reviewedAt)}</span>}
            {partnerDetailModal.rejectionReason && <div style={{ marginTop: 6, color: "#f87171" }}>Reason: {partnerDetailModal.rejectionReason}</div>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 16, maxHeight: "50vh", overflow: "auto", fontSize: 12 }}>
          {[
            ["Name", partnerDetailModal.name], ["Phone", partnerDetailModal.phone], ["Email", partnerDetailModal.email],
            ["DOB", partnerDetailModal.dateOfBirth], ["PAN", partnerDetailModal.pan], ["Pincode", partnerDetailModal.pincode],
            ["City (current)", partnerDetailModal.cityCurrent], ["City (applying)", partnerDetailModal.cityApplying],
            ["Time in city", partnerDetailModal.cityResidencyYears], ["Education", partnerDetailModal.educationLevel],
            ["Institute", partnerDetailModal.instituteName || "—"], ["Occupation", partnerDetailModal.occupation],
            ["Industry", partnerDetailModal.industry], ["Experience (yrs)", partnerDetailModal.workExperienceYears],
            ["Role description", partnerDetailModal.roleDescription], ["Heard about", partnerDetailModal.hearAbout],
            ["Program understanding", partnerDetailModal.programUnderstanding], ["Why partner", partnerDetailModal.whyPartner],
            ["Day-to-day", partnerDetailModal.dayToDayInvolvement], ["Time commitment", partnerDetailModal.timeCommitment],
            ["Family income", partnerDetailModal.familyIncome], ["Investment", partnerDetailModal.investmentAmount],
            ["Funding plan", partnerDetailModal.fundingPlan], ["Related to employee", partnerDetailModal.relatedToEmployee],
            ["Provides to VegFru", partnerDetailModal.providesToVegFru], ["Partners #", partnerDetailModal.partnerCount],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ background: "var(--sa-surface)", borderRadius: 10, padding: "8px 12px", gridColumn: k === "Role description" || k === "Program understanding" ? "1 / -1" : undefined }}>
              <div style={{ fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 12, color: "var(--sa-text)", whiteSpace: "pre-wrap" }}>{String(v)}</div>
            </div>
          ))}
        </div>
        {(!partnerDetailModal.status || partnerDetailModal.status === "pending") ? (
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => rejectPartnerApplication(partnerDetailModal._id)} disabled={busy}
              style={{ flex: 1, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 11, padding: "12px", color: "#f87171", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
              Reject
            </button>
            <button onClick={() => approvePartnerApplication(partnerDetailModal._id)} disabled={busy}
              style={{ flex: 2, background: "linear-gradient(135deg,#14532d,#166534)", border: "none", borderRadius: 11, padding: "12px", color: "#fff", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
              Approve &amp; create admin
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setPartnerDetailModal(null)}
            style={{ marginTop: 12, width: "100%", background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 11, padding: "12px", color: "var(--sa-text)", fontWeight: 600, cursor: "pointer" }}>
            Close
          </button>
        )}
      </Modal>}

      {deliveryPartnerDetailModal && <Modal title="Delivery rider application" subtitle={deliveryPartnerDetailModal.phone} onClose={() => setDeliveryPartnerDetailModal(null)} width={480}>
        {deliveryPartnerDetailModal.status && deliveryPartnerDetailModal.status !== "pending" && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "var(--sa-surface)", border: "1px solid var(--sa-card-border)", fontSize: 12, color: "var(--sa-text)" }}>
            <strong style={{ textTransform: "uppercase", letterSpacing: 1 }}>{deliveryPartnerDetailModal.status}</strong>
            {deliveryPartnerDetailModal.reviewedAt && <span style={{ color: "var(--sa-muted)", marginLeft: 8 }}>· {fmtDate(deliveryPartnerDetailModal.reviewedAt)}</span>}
            {deliveryPartnerDetailModal.userId && <div style={{ marginTop: 6, fontSize: 11, color: "var(--sa-muted)" }}>User ID: {deliveryPartnerDetailModal.userId}</div>}
            {deliveryPartnerDetailModal.rejectionReason && <div style={{ marginTop: 6, color: "#f87171" }}>Reason: {deliveryPartnerDetailModal.rejectionReason}</div>}
          </div>
        )}
        <div style={{ display: "grid", gap: 10, marginBottom: 16, fontSize: 13 }}>
          {[
            ["Name", deliveryPartnerDetailModal.name],
            ["Phone", deliveryPartnerDetailModal.phone],
            ["City", deliveryPartnerDetailModal.city],
            ["Submitted", fmtDate(deliveryPartnerDetailModal.submittedAt)],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ background: "var(--sa-surface)", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "var(--sa-muted)", fontFamily: "monospace", marginBottom: 4 }}>{k}</div>
              <div style={{ color: "var(--sa-text)" }}>{String(v)}</div>
            </div>
          ))}
        </div>
        {(!deliveryPartnerDetailModal.status || deliveryPartnerDetailModal.status === "pending") && (
          <>
            <p style={{ fontSize: 12, color: "var(--sa-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Approving creates a delivery account for this phone. The partner signs in on the delivery app with OTP (no password).
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => rejectDeliveryPartnerApp(deliveryPartnerDetailModal._id)} disabled={busy}
                style={{ flex: 1, background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 11, padding: "12px", color: "#f87171", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                Reject
              </button>
              <button onClick={() => approveDeliveryPartnerApp(deliveryPartnerDetailModal._id)} disabled={busy}
                style={{ flex: 2, background: "linear-gradient(135deg,#14532d,#166534)", border: "none", borderRadius: 11, padding: "12px", color: "#fff", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                Approve &amp; enable OTP login
              </button>
            </div>
          </>
        )}
        {deliveryPartnerDetailModal.status && deliveryPartnerDetailModal.status !== "pending" && (
          <button type="button" onClick={() => setDeliveryPartnerDetailModal(null)}
            style={{ marginTop: 12, width: "100%", background: "var(--sa-ghost-bg)", border: "1px solid var(--sa-ghost-border)", borderRadius: 11, padding: "12px", color: "var(--sa-text)", fontWeight: 600, cursor: "pointer" }}>
            Close
          </button>
        )}
      </Modal>}
    </div>
  );
}
