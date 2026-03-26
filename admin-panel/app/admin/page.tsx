"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Truck, Shield,
  LogOut, TrendingUp, AlertCircle, CheckCircle, Clock,
  Plus, Search, Trash2, Edit2, Star, X, Menu, Loader2,
  Bell, Settings, ChevronDown, Filter, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, UserPlus,
  BarChart3, Activity, ShieldCheck, IndianRupee, Zap, Sun, Moon, Leaf, ChevronRight
} from "lucide-react";
import { VegFruBrandBar } from "@/components/VegFruBrandBar";

type OrderStatus = "pending" | "confirmed" | "preparing" | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled";
type UserRole = "superadmin" | "admin" | "delivery" | "customer";

const S: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d" },
  confirmed: { label: "Confirmed", color: "#3b82f6", bg: "#dbeafe", border: "#93c5fd" },
  preparing: { label: "Preparing", color: "#8b5cf6", bg: "#ede9fe", border: "#c4b5fd" },
  assigned: { label: "Assigned", color: "#06b6d4", bg: "#cffafe", border: "#67e8f9" },
  picked_up: { label: "Picked Up", color: "#f97316", bg: "#ffedd5", border: "#fdba74" },
  out_for_delivery: { label: "Out for Delivery", color: "#0ea5e9", bg: "#e0f2fe", border: "#7dd3fc" },
  delivered: { label: "Delivered", color: "#22c55e", bg: "#dcfce7", border: "#86efac" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2", border: "#fca5a5" },
};

const ROLE_CFG: Record<UserRole, { label: string; color: string; bg: string }> = {
  superadmin: { label: "Super Admin", color: "#a855f7", bg: "#f3e8ff" },
  admin: { label: "Admin", color: "#3b82f6", bg: "#dbeafe" },
  delivery: { label: "Delivery", color: "#f97316", bg: "#ffedd5" },
  customer: { label: "Customer", color: "#22c55e", bg: "#dcfce7" },
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "customers", label: "Customers", icon: Users },
  { id: "users", label: "User Mgmt", icon: Shield, superOnly: true },
  { id: "activity", label: "Activity Log", icon: Activity, superOnly: true },
];

function fmt(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Badge({ status }: { status: string }) {
  const c = S[status as OrderStatus] || S.pending;
  return <span style={{ background: "var(--adm-surface)", color: c.color, border: `1px solid ${c.color}30`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
    {status.replace(/_/g, " ")}
  </span>;
}

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_CFG[role as UserRole] || { label: role, color: "#6b7280", bg: "#f3f4f6" };
  return <span style={{ background: "var(--adm-surface)", color: c.color, border: `1px solid ${c.color}30`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.3px" }}>{c.label}</span>;
}

async function cq(url: string, path: string, args: object = {}) {
  if (!url) return null;
  try {
    const r = await fetch(`${url}/api/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, args }) });
    return (await r.json()).value;
  } catch { return null; }
}
async function cm(url: string, path: string, args: object = {}) {
  if (!url) return null;
  const r = await fetch(`${url}/api/mutation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path, args }) });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json() as { status?: string; errorMessage?: string; value?: unknown };
  if (j.status === "error" || j.errorMessage) throw new Error(j.errorMessage || "Mutation failed");
  return j.value;
}

const Modal = ({ title, subtitle, onClose, children, width = 480 }: any) => (
  <div style={{ position: "fixed", inset: 0, background: "var(--adm-overlay)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ background: "var(--adm-modal-bg)", border: "1px solid var(--adm-modal-border)", borderRadius: 20, width: "100%", maxWidth: width, maxHeight: "88vh", overflow: "auto", boxShadow: "var(--adm-modal-shadow)" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--adm-card-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "sticky", top: 0, background: "var(--adm-modal-bg)", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--adm-text)" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--adm-muted)", marginTop: 3 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ background: "var(--adm-surface)", border: "none", borderRadius: 8, color: "var(--adm-muted)", cursor: "pointer", padding: 6, display: "flex" }}><X size={16} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const FormField = ({ label, value, onChange, type = "text", placeholder, required = false, readOnly = false }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 7, textTransform: "uppercase" }}>{label}{required && " *"}</label>
    <input value={value} onChange={e => !readOnly && onChange(e.target.value)} type={type} placeholder={placeholder} readOnly={readOnly}
      style={{ width: "100%", background: "var(--adm-input-bg)", border: "1px solid var(--adm-input-border)", borderRadius: 10, padding: "10px 12px", color: "var(--adm-text)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
      onFocus={e => !readOnly && (e.target.style.borderColor = "#22c55e")}
      onBlur={e => (e.target.style.borderColor = "var(--adm-input-border)")} />
  </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 1.5, marginBottom: 7, textTransform: "uppercase" }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "var(--adm-input-bg)", border: "1px solid var(--adm-input-border)", borderRadius: 10, padding: "10px 12px", color: "var(--adm-text)", fontSize: 13, outline: "none", appearance: "none" }}>
      {options.map((o: any, idx: number) => <option key={idx} value={o.value || o} style={{ background: "var(--adm-modal-bg)" }}>{o.label || o}</option>)}
    </select>
  </div>
);

const SubmitBtn = ({ label, loading, onClick, color = "#15803d", icon: Icon }: any) => (
  <button onClick={onClick} disabled={loading}
    style={{ width: "100%", background: color, color: "#fff", border: "none", borderRadius: 11, padding: "12px", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1, marginTop: 4, transition: "opacity 0.2s" }}>
    {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : Icon && <Icon size={16} />}
    {loading ? "Saving..." : label}
  </button>
);

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function AdminDashboard() {
  const CURL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

  // Auth
  const [adminUser, setAdminUser] = useState<any>(null);
  const isSuperAdmin = adminUser?.role === "superadmin";

  // Data
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const productSearchFocusedRef = useRef(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteSelectedProductIds, setDeleteSelectedProductIds] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [newProd, setNewProd] = useState({ name: "", category: "vegetables", price: "", originalPrice: "", unit: "", emoji: "🥬", stock: "", description: "", tag: "Organic", badge: "", image: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", phone: "", role: "admin" });
  const [editProdForm, setEditProdForm] = useState({ price: "", stock: "", badge: "", description: "", image: "" });
  const [editUserForm, setEditUserForm] = useState({ name: "", phone: "", role: "", isActive: true, newPassword: "" });

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" }>({ msg: "", type: "ok" });
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

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "ok" }), 3000);
  };

  function exportOrdersCSV() {
    const rows = [["Order ID", "Customer", "Phone", "Address", "Total", "Payment", "Status", "Date"]];
    orders.forEach(o => {
      rows.push([
        o._id?.slice(-8).toUpperCase() || "",
        o.customerName || "",
        o.customerPhone || "",
        (o.deliveryAddress || "").replace(/,/g, " "),
        String(o.total),
        o.paymentMethod?.toUpperCase() || "",
        o.status || "",
        o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "",
      ]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `vegfru-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Orders exported as CSV");
  }

  // Load admin from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("vegfru_admin");
      if (s) setAdminUser(JSON.parse(s));
    } catch { }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vegfru_admin_theme");
      if (saved === "light") setIsDarkMode(false);
    } catch { }
  }, []);

  const getDist = (lat1?: number, lon1?: number, lat2?: number, lon2?: number) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in km
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-adm-theme", isDarkMode ? "dark" : "light");
    document.documentElement.style.colorScheme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  useEffect(() => {
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
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("vegfru_admin_theme", next ? "dark" : "light");
      } catch { }
      return next;
    });
  };

  function signOutAdmin() {
    try {
      document.cookie = "vegfru_token=;path=/;max-age=0";
      document.cookie = "vegfru_user=;path=/;max-age=0";
    } catch { }
    localStorage.removeItem("vegfru_admin");
    window.location.href = "/";
  }

  // ── StatCard ────────────────────────────────────────────────
  function StatCard({ icon: Icon, label, value, sub, color }: any) {
    return (
      <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, padding: "18px 20px", transition: "all 0.25s ease", boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)" }}
        onMouseEnter={e => {
          (e.currentTarget as any).style.borderColor = `${color}40`;
          if (!isDarkMode) (e.currentTarget as any).style.boxShadow = `0 8px 24px ${color}15`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as any).style.borderColor = "var(--adm-card-border)";
          if (!isDarkMode) (e.currentTarget as any).style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
        }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={18} color={color} />
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "var(--adm-text)", letterSpacing: "-0.5px", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--adm-muted)", marginTop: 5 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 4 }}>{sub}</div>}
      </div>
    );
  }

  // ── Theme tokens (light + dark readable contrast) ────────────
  const adminTheme: React.CSSProperties = {
    ["--adm-bg" as string]: isDarkMode ? "#060810" : "#FEFAE0",
    ["--adm-sidebar" as string]: isDarkMode ? "#0d1117" : "#fffef4",
    ["--adm-topbar" as string]: isDarkMode ? "#0d1117" : "#FEFAE0",
    ["--adm-panel-border" as string]: isDarkMode ? "rgba(22,163,74,0.2)" : "rgba(22,101,52,0.12)",
    ["--adm-text" as string]: isDarkMode ? "#f1f5f9" : "#0f172a",
    ["--adm-muted" as string]: isDarkMode ? "#94a3b8" : "#475569",
    ["--adm-card" as string]: isDarkMode ? "rgba(255,255,255,0.04)" : "#ffffff",
    ["--adm-card-border" as string]: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(22,101,52,0.12)",
    ["--adm-surface" as string]: isDarkMode ? "rgba(255,255,255,0.06)" : "#f8faf2",
    ["--adm-input-bg" as string]: isDarkMode ? "rgba(255,255,255,0.06)" : "#ffffff",
    ["--adm-input-border" as string]: isDarkMode ? "rgba(255,255,255,0.14)" : "#cbd5e1",
    ["--adm-input-text" as string]: isDarkMode ? "#f1f5f9" : "#0f172a",
    ["--adm-modal-bg" as string]: isDarkMode ? "#0d1117" : "#ffffff",
    ["--adm-modal-border" as string]: isDarkMode ? "rgba(34,197,94,0.25)" : "rgba(22,101,52,0.16)",
    ["--adm-modal-shadow" as string]: isDarkMode ? "0 25px 80px rgba(0,0,0,0.75)" : "0 25px 60px rgba(15,23,42,0.12)",
    ["--adm-overlay" as string]: isDarkMode ? "rgba(0,0,0,0.82)" : "rgba(15,23,42,0.45)",
    ["--adm-row-hover" as string]: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(22,101,52,0.05)",
    ["--adm-ghost-bg" as string]: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(22,101,52,0.08)",
    ["--adm-ghost-border" as string]: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(22,101,52,0.2)",
    ["--adm-sidebar-muted" as string]: isDarkMode ? "rgba(255,255,255,0.4)" : "#64748b",
    ["--adm-logo-text" as string]: isDarkMode ? "#ffffff" : "#0f172a",
    ["--adm-track" as string]: isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0",
  };

  const loadAll = useCallback(async () => {
    if (!CURL) { setLoading(false); return; }
    setLoading(true);
    try {
      const [o, p, u, d, s, a, rv, tp] = await Promise.all([
        cq(CURL, "orders:getAllOrders", { limit: 200 }),
        cq(CURL, "products:getAllProducts", { includeInactive: true }),
        cq(CURL, "auth:getAllUsers", {}),
        cq(CURL, "auth:getAllDeliveryBoys", {}),
        cq(CURL, "orders:getAdminStats", {}),
        cq(CURL, "auth:getActivityLog", { limit: 100 }),
        cq(CURL, "orders:getRevenueByDay", { days: 7 }),
        cq(CURL, "orders:getTopProducts", {}),
      ]);
      setOrders(o || []); setProducts(p || []); setUsers(u || []);
      setDeliveryBoys(d || []); setStats(s || null); setActivityLog(a || []);
      setRevenueData(rv || []); setTopProducts(tp || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [CURL]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const t = setInterval(loadAll, 20000);
    return () => clearInterval(t);
  }, [loadAll]);

  const filteredOrders = orders.filter(o => {
    const matchStatus = orderFilter === "all" || o.status === orderFilter;
    const q = orderSearch.toLowerCase();
    const matchSearch = !q || o.customerName?.toLowerCase().includes(q) || o.customerPhone?.includes(q) || o._id?.toLowerCase().includes(q) || o.deliveryAddress?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const filteredProducts = products.filter(p =>
    (p?.name || "").toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  useEffect(() => {
    if (orders.length === 0) return;
    const isFirstLoad = seenOrderIds.current.size === 0;
    
    // Check for new orders
    const newOrders = orders.filter(o => !seenOrderIds.current.has(o._id));
    if (newOrders.length > 0) {
      if (!isFirstLoad) {
        const isDelivery = adminUser?.role === "delivery";
        if (isDelivery) {
          const myNew = newOrders.some(o => o.assignedDeliveryBoyName === adminUser.name);
          if (myNew) playNotifSound("chime");
        } else {
          const hasPending = newOrders.some(o => o.status === "pending");
          if (hasPending) playNotifSound("alert");
        }
      }
      // Add to seen
      newOrders.forEach(o => seenOrderIds.current.add(o._id));
    }
  }, [orders, adminUser, playNotifSound]);

  const pendingOrders = orders.filter(o => o.status === "pending");

  // Actions
  async function nextStatus(orderId: string, current: OrderStatus) {
    const map: Partial<Record<OrderStatus, OrderStatus>> = {
      pending: "confirmed", confirmed: "preparing", preparing: "assigned",
      assigned: "picked_up", picked_up: "out_for_delivery", out_for_delivery: "delivered"
    };
    const next = map[current];
    if (!next) return;
    setBusy(true);
    try {
      await cm(CURL, "orders:updateOrderStatus", { orderId, status: next });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: next } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder((p: any) => p ? { ...p, status: next } : null);
      showToast(`Order moved to ${S[next].label}`);
    } catch { showToast("Failed to update status", "err"); }
    setBusy(false);
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    setBusy(true);
    try {
      await cm(CURL, "orders:updateOrderStatus", { orderId, status: "cancelled", note: "Cancelled by admin" });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o));
      showToast("Order cancelled");
    } catch { showToast("Failed", "err"); }
    setBusy(false);
  }

  async function assignDelivery(orderId: string, boy: any) {
    setBusy(true);
    try {
      await cm(CURL, "orders:assignDeliveryBoy", { orderId, deliveryBoyId: boy._id, deliveryBoyName: boy.name });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, assignedDeliveryBoyName: boy.name, status: "assigned" } : o));
      setAssignModal(null); showToast(`Assigned to ${boy.name}`);
    } catch { showToast("Failed", "err"); }
    setBusy(false);
  }

  async function toggleProductActive(p: any) {
    await cm(CURL, "products:updateProduct", { id: p._id, isActive: !p.isActive });
    setProducts(prev => prev.map(x => x._id === p._id ? { ...x, isActive: !x.isActive } : x));
    showToast(p.isActive ? "Product deactivated" : "Product activated");
  }

  async function bulkSetProductActive(isActive: boolean) {
    if (selectedProductIds.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(selectedProductIds.map(id => cm(CURL, "products:updateProduct", { id, isActive })));
      setProducts(prev => prev.map(p => selectedProductIds.includes(p._id) ? { ...p, isActive } : p));
      showToast(`${selectedProductIds.length} product(s) ${isActive ? "activated" : "deactivated"}`);
      setSelectedProductIds([]);
    } catch {
      showToast("Bulk update failed", "err");
    }
    setBusy(false);
  }

  useEffect(() => {
    if (productSearchFocusedRef.current) {
      productSearchInputRef.current?.focus();
    }
  }, [productSearch]);

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    await cm(CURL, "products:deleteProduct", { id });
    setProducts(prev => prev.filter(p => p._id !== id));
    showToast("Product deleted");
  }

  async function confirmDeleteSelectedProducts() {
    if (!deleteSelectedProductIds || deleteSelectedProductIds.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(deleteSelectedProductIds.map(id => cm(CURL, "products:deleteProduct", { id })));
      setProducts(prev => prev.filter(p => !deleteSelectedProductIds.includes(p._id)));
      setSelectedProductIds([]);
      setDeleteSelectedProductIds(null);
      showToast(`${deleteSelectedProductIds.length} product(s) deleted`);
    } catch {
      showToast("Bulk delete failed", "err");
    }
    setBusy(false);
  }

  async function saveEditProduct() {
    if (!editProduct) return;
    setBusy(true);
    try {
      await cm(CURL, "products:updateProduct", {
        id: editProduct._id,
        price: Number(editProdForm.price) || editProduct.price,
        stock: Number(editProdForm.stock) || editProduct.stock,
        badge: editProdForm.badge || undefined,
        description: editProdForm.description || undefined,
        image: editProdForm.image.trim() || undefined,
      });
      setProducts(prev => prev.map(p => p._id === editProduct._id
        ? {
          ...p,
          price: Number(editProdForm.price) || p.price,
          stock: Number(editProdForm.stock) || p.stock,
          badge: editProdForm.badge || p.badge,
          description: editProdForm.description || p.description,
          image: editProdForm.image.trim() || p.image,
        }
        : p));
      setEditProduct(null); showToast("Product updated");
    } catch { showToast("Update failed", "err"); }
    setBusy(false);
  }

  async function addProduct() {
    if (!newProd.name || !newProd.price) return;
    setBusy(true);
    try {
      await cm(CURL, "products:createProduct", {
        name: newProd.name, category: newProd.category,
        price: Number(newProd.price), originalPrice: Number(newProd.originalPrice) || Number(newProd.price),
        unit: newProd.unit, emoji: newProd.emoji, stock: Number(newProd.stock) || 0,
        description: newProd.description, tag: newProd.tag, badge: newProd.badge || undefined,
        image: newProd.image.trim() || undefined,
      });
      setShowAddProduct(false);
      setNewProd({ name: "", category: "vegetables", price: "", originalPrice: "", unit: "", emoji: "🥬", stock: "", description: "", tag: "Organic", badge: "", image: "" });
      await loadAll(); showToast("Product added to database");
    } catch { showToast("Add failed", "err"); }
    setBusy(false);
  }

  async function onNewProductImageFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file", "err");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setNewProd(p => ({ ...p, image: dataUrl }));
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
      setEditProdForm(f => ({ ...f, image: dataUrl }));
      showToast("Image selected");
    } catch {
      showToast("Could not read image", "err");
    }
  }

  async function addUser() {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    if (!isSuperAdmin) { showToast("Super admin only", "err"); return; }
    if (!adminUser?.id) { showToast("Please login again", "err"); return; }
    setBusy(true);
    try {
      const bcrypt = await import("bcryptjs");
      const hash = await (bcrypt as any).hash(newUser.password, 10);
      await cm(CURL, "adminAuth:createAdminBySuperAdmin", {
        creatorId: adminUser.id,
        name: newUser.name, email: newUser.email, passwordHash: hash,
        role: newUser.role,
      });
      setShowAddUser(false);
      setNewUser({ name: "", email: "", password: "", phone: "", role: "admin" });
      showToast(`${newUser.role} account created`);
    } catch (e: any) { showToast(e.message || "Failed to create user", "err"); }
    setBusy(false);
  }

  async function saveEditUser() {
    if (!editUser) return;
    setBusy(true);
    try {
      await cm(CURL, "auth:updateUser", {
        id: editUser._id,
        name: editUserForm.name || undefined,
        phone: editUserForm.phone || undefined,
        role: editUserForm.role as any || undefined,
        isActive: editUserForm.isActive,
        updatedBy: adminUser?._id || "admin",
      });
      // Update password if provided
      if (editUserForm.newPassword && editUserForm.newPassword.length >= 6) {
        const bcrypt = await import("bcryptjs");
        const hash = await (bcrypt as any).hash(editUserForm.newPassword, 10);
        await cm(CURL, "auth:updateUserPassword", { id: editUser._id, passwordHash: hash });
        showToast("User updated & password changed");
      } else {
        showToast("User updated");
      }
      setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...editUserForm } : u));
      setEditUser(null);
    } catch { showToast("Update failed", "err"); }
    setBusy(false);
  }

  async function deleteUserAction(id: string, email: string) {
    if (!isSuperAdmin) { showToast("Super admin only", "err"); return; }
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    await cm(CURL, "auth:deleteUser", { id, deletedBy: adminUser?._id });
    setUsers(prev => prev.filter(u => u._id !== id));
    showToast("User deleted");
  }

  // ── Sidebar ──────────────────────────────────────────────────
  const Sidebar = () => (
    <aside style={{
      width: isMobile ? 264 : (sidebarOpen ? 240 : 68), flexShrink: 0,
      background: "var(--adm-sidebar)",
      borderRight: "1px solid var(--adm-panel-border)",
      display: "flex", flexDirection: "column",
      transition: "transform 0.25s ease, width 0.25s ease",
      overflow: "hidden",
      position: isMobile ? "fixed" : "relative",
      top: isMobile ? 0 : undefined,
      left: isMobile ? 0 : undefined,
      height: isMobile ? "100vh" : undefined,
      zIndex: isMobile ? 130 : 1,
      transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none"
    }}>
      {/* Top spacing (match superadmin layout) */}
      <div style={{ height: 12, borderBottom: "1px solid rgba(22,163,74,0.14)" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.filter(n => !n.superOnly || isSuperAdmin).map(({ id, label, icon: Icon, superOnly }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => { setTab(id); if (isMobile) setSidebarOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                borderRadius: 10, border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s",
                background: active ? "linear-gradient(135deg,#14532d,#166534)" : "transparent",
                color: active ? "#fff" : "var(--adm-sidebar-muted)",
                boxShadow: active ? "0 4px 14px rgba(20,83,45,0.35)" : "none",
              }}
              title={!sidebarOpen ? label : undefined}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              {sidebarOpen && <>
                <span style={{ flex: 1 }}>{label}</span>
                {superOnly && <ShieldCheck size={11} style={{ color: "#a855f7", opacity: 0.8 }} />}
              </>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--adm-card-border)" }}>
        <button onClick={signOutAdmin}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 10, background: "transparent", color: "var(--adm-sidebar-muted)", border: "none", cursor: "pointer", width: "100%", fontSize: 13, transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as any).style.color = "#f87171" }}
          onMouseLeave={e => { (e.currentTarget as any).style.background = "transparent"; (e.currentTarget as any).style.color = "var(--adm-sidebar-muted)" }}>
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {sidebarOpen && "Sign Out"}
        </button>
      </div>
    </aside>
  );

  // ── Dashboard ─────────────────────────────────────────────────
  const Dashboard = () => {
    const rev = orders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + o.total, 0);
    const todayOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lowStock = products.filter(p => p.stock < 10 && p.isActive);
    const weekRev = orders.filter(o => Date.now() - o.createdAt < 7 * 86400000 && o.status === "delivered").reduce((s: number, o: any) => s + o.total, 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }} className="fade-in">
        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          <StatCard label="Total Revenue" value={`₹${rev.toLocaleString()}`} sub={`₹${weekRev.toLocaleString()} this week`} icon={IndianRupee} color="#22c55e" />
          <StatCard label="Total Orders" value={orders.length} sub={`${orders.filter(o => o.status === "pending").length} pending`} icon={ShoppingBag} color="#3b82f6" />
          <StatCard label="Today's Orders" value={todayOrders.length} sub={`${todayOrders.filter(o => o.status === "delivered").length} delivered`} icon={Zap} color="#a855f7" />
          <StatCard label="Low Stock Items" value={lowStock.length} sub="need restocking" icon={AlertCircle} color="#f59e0b" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 24 }}>
          {/* Recent orders */}
          <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--adm-card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--adm-text)" }}>Recent Orders</span>
              <button onClick={() => setTab("orders")} style={{ fontSize: 12, color: "#16a34a", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>View all →</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              {loading ? (
                <div style={{ padding: 48, textAlign: "center", color: "var(--adm-muted)" }}>
                  <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 13 }}>Syncing with Convex...</div>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ padding: 64, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📦</div>
                  <div style={{ color: "var(--adm-muted)", fontSize: 14, maxWidth: 240, margin: "0 auto" }}>No orders yet. Orders from the storefront appear here in real time.</div>
                </div>
              ) : (
                orders.slice(0, 10).map((o: any) => (
                  <div key={o._id} onClick={() => setSelectedOrder(o)}
                    style={{ padding: "14px 20px", borderBottom: "1px solid var(--adm-card-border)", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as any).style.background = "var(--adm-row-hover)"}
                    onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--adm-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "monospace", color: "var(--adm-muted)", fontWeight: 700, flexShrink: 0, border: "1px solid var(--adm-card-border)" }}>
                      #{o._id?.slice(-3).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--adm-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: "var(--adm-muted)", marginTop: 2 }}>{fmt(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", marginBottom: 4 }}>₹{o.total}</div>
                      <Badge status={o.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Low stock alert */}
            <div style={{ background: "var(--adm-card)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 16, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertCircle size={16} color="#f59e0b" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>Stock Alerts ({lowStock.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lowStock.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--adm-muted)", padding: "10px 0", textAlign: "center" }}>Inventory looks good!</div>
                ) : lowStock.slice(0, 5).map((p: any) => (
                  <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 10, background: "var(--adm-surface)" }}>
                    <span style={{ fontSize: 20 }}>{p.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--adm-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: p.stock === 0 ? "#ef4444" : "#f59e0b", fontWeight: 700 }}>{p.stock === 0 ? "OUT OF STOCK" : `${p.stock} remaining`}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats breakdown */}
            <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--adm-text)", marginBottom: 16 }}>Order Status Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(S).map(([status, cfg]) => {
                  const count = orders.filter((o: any) => o.status === status).length;
                  const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
                  return count > 0 ? (
                    <div key={status}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--adm-muted)", fontWeight: 500 }}>{cfg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--adm-surface)", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: cfg.color, width: `${pct}%`, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OrdersTab = () => (
    <div className="fade-in">
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "1 1 0", minWidth: 280 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--adm-muted)" }} />
          <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search for name, phone, or order ID..."
            style={{ width: "100%", background: "var(--adm-input-bg)", border: "1px solid var(--adm-input-border)", borderRadius: 12, padding: "10px 14px 10px 36px", color: "var(--adm-text)", fontSize: 13, outline: "none", boxSizing: "border-box", boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.05)" }} />
        </div>
        {orderSearch && <button onClick={() => setOrderSearch("")} style={{ background: "var(--adm-ghost-bg)", border: "none", borderRadius: 8, padding: "8px 14px", color: "var(--adm-muted)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Clear</button>}
        <button onClick={exportOrdersCSV} style={{ marginLeft: isMobile ? 0 : "auto", display: "flex", alignItems: "center", gap: 6, background: "var(--adm-ghost-bg)", border: "1px solid var(--adm-ghost-border)", borderRadius: 10, padding: "9px 16px", color: "var(--adm-muted)", fontSize: 12, cursor: "pointer", transition: "all 0.15s", fontWeight: 600 }}>
          <Download size={13} /> Export CSV
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["all", "pending", "confirmed", "preparing", "assigned", "out_for_delivery", "delivered", "cancelled"].map(s => (
          <button key={s} onClick={() => setOrderFilter(s)}
            style={{
              padding: "7px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              border: "1px solid",
              background: orderFilter === s ? (isDarkMode ? "#15803d" : "rgba(34,197,94,0.18)") : "var(--adm-surface)",
              color: orderFilter === s ? (isDarkMode ? "#fff" : "#15803d") : "var(--adm-muted)",
              borderColor: orderFilter === s ? (isDarkMode ? "#22c55e" : "rgba(34,197,94,0.3)") : "var(--adm-input-border)",
            }}>
            {s === "all" ? `All (${orders.length})` : `${S[s as OrderStatus]?.label || s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, overflow: "hidden", boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--adm-card-border)" }}>
                {["Order", "Customer", "Address", "Amount", "Payment", "Status", "Time", "Actions"].map(h => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Loading from Convex DB...
                </td></tr>
                : filteredOrders.length === 0
                  ? <tr><td colSpan={8} style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No orders yet. Place an order on the storefront to see it here.</div>
                  </td></tr>
                  : filteredOrders.map((o: any) => (
                    <tr key={o._id} style={{ borderBottom: "1px solid var(--adm-card-border)", cursor: "pointer", transition: "background 0.1s" }}
                      onClick={() => setSelectedOrder(o)}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "var(--adm-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--adm-muted)", fontWeight: 600 }}>#{o._id?.slice(-6).toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--adm-text)" }}>{o.customerName}</div>
                        <div style={{ fontSize: 11, color: "var(--adm-muted)" }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 11, color: "var(--adm-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.deliveryAddress}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>₹{o.total}</div>
                        <div style={{ fontSize: 10, color: "var(--adm-muted)" }}>{o.deliveryFee > 0 ? `+₹${o.deliveryFee} del` : "Free del"}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-card-border)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "var(--adm-muted)", fontFamily: "monospace" }}>{o.paymentMethod?.toUpperCase()}</span>
                        <div style={{ fontSize: 10, color: o.paymentStatus === "paid" ? "#16a34a" : "#f59e0b", marginTop: 3 }}>{o.paymentStatus}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><Badge status={o.status} /></td>
                      <td style={{ padding: "13px 16px", fontSize: 11, color: "var(--adm-muted)", whiteSpace: "nowrap" }}>{fmt(o.createdAt)}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                          {!["delivered", "cancelled"].includes(o.status) && (
                            <button onClick={() => nextStatus(o._id, o.status)}
                              style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, background: "#15803d", color: "#bbf7d0", border: "none", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                              → Next
                            </button>
                          )}
                          {o.status === "pending" && (
                            <button onClick={() => setAssignModal(o._id)}
                              style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, background: "rgba(6,182,212,0.15)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.3)", cursor: "pointer", whiteSpace: "nowrap" }}>
                              Assign
                            </button>
                          )}
                          {!["delivered", "cancelled"].includes(o.status) && (
                            <button onClick={() => cancelOrder(o._id)}
                              style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", cursor: "pointer" }}>
                              Cancel
                            </button>
                          )}
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

  useEffect(() => {
    setSelectedProductIds(prev => prev.filter(id => products.some((p: any) => p._id === id)));
  }, [products]);

  // ── Products Tab ──────────────────────────────────────────────
  const ProductsTab = () => (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "0 0 auto", minWidth: 260 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--adm-muted)" }} />
          <input
            ref={productSearchInputRef}
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            placeholder={`Search ${products.length} products...`}
            style={{ width: "100%", background: "var(--adm-input-bg)", border: "1px solid var(--adm-input-border)", borderRadius: 12, padding: "10px 14px 10px 36px", color: "var(--adm-text)", fontSize: 13, outline: "none", boxSizing: "border-box", boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.05)" }}
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
        <div style={{ display: "flex", gap: 8 }}>
          {selectedProductIds.length > 0 && <>
            <button onClick={() => { void bulkSetProductActive(true); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "8px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Activate ({selectedProductIds.length})
            </button>
            <button onClick={() => { void bulkSetProductActive(false); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "8px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Deactivate
            </button>
            {isSuperAdmin && <button onClick={() => setDeleteSelectedProductIds(selectedProductIds)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(220,38,38,0.12)", color: "#f87171", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 10, padding: "8px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
              Delete ({selectedProductIds.length})
            </button>}
          </>}
          {isSuperAdmin && <button onClick={() => setShowAddProduct(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <Plus size={14} /> Add Product
          </button>}
        </div>
      </div>

      <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, overflow: "hidden", boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--adm-card-border)" }}>
                <th style={{ padding: "13px 12px", width: 36 }}>
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && filteredProducts.every((p: any) => selectedProductIds.includes(p._id))}
                    onChange={e => setSelectedProductIds(e.target.checked ? filteredProducts.map((p: any) => p._id) : [])}
                    style={{ accentColor: "#15803d", cursor: "pointer" }}
                  />
                </th>
                {["Product", "Category", "Price", "Stock", "Rating", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 1.5, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Loading products...</div>
                </td></tr>
                : filteredProducts.length === 0
                  ? <tr><td colSpan={8} style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No products yet. Run <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>npx convex run products:seedProducts</code></div>
                  </td></tr>
                  : filteredProducts.map((p: any) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid var(--adm-card-border)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "var(--adm-row-hover)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "12px 12px" }}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p._id)}
                          onChange={e => setSelectedProductIds(prev => e.target.checked ? [...prev, p._id] : prev.filter(id => id !== p._id))}
                          style={{ accentColor: "#15803d", cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{p.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--adm-text)" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "var(--adm-muted)" }}>{p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-card-border)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "var(--adm-muted)" }}>{p.category}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>₹{p.price}</div>
                        <div style={{ fontSize: 10, color: "var(--adm-muted)", textDecoration: "line-through" }}>₹{p.originalPrice}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.stock === 0 ? "#ef4444" : p.stock < 10 ? "#f59e0b" : "#16a34a" }}>{p.stock}</span>
                        {p.stock < 10 && p.stock > 0 && <span style={{ fontSize: 10, color: "#f59e0b", marginLeft: 4 }}>⚠ Low</span>}
                        {p.stock === 0 && <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 4 }}>⛔ Out</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={11} color="#f59e0b" fill="#f59e0b" />
                          <span style={{ fontSize: 13, color: "var(--adm-text)" }}>{p.rating?.toFixed(1) || "—"}</span>
                          <span style={{ fontSize: 10, color: "var(--adm-muted)" }}>({p.reviews || 0})</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => toggleProductActive(p)}
                          style={{
                            padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: "none", fontWeight: 600,
                            background: p.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)",
                            color: p.isActive ? "#4ade80" : "#f87171"
                          }}>
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => {
                            setEditProduct(p);
                            setEditProdForm({
                              price: String(p.price),
                              stock: String(p.stock),
                              badge: p.badge || "",
                              description: p.description || "",
                              image: p.image || "",
                            });
                          }}
                            style={{ background: "rgba(59,130,246,0.12)", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#60a5fa" }}>
                            <Edit2 size={13} />
                          </button>
                          {isSuperAdmin && <button onClick={() => deleteProduct(p._id)}
                            style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#f87171" }}>
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

  // ── Delivery Tab ──────────────────────────────────────────────
  const DeliveryTab = () => (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 24 }}>
        {deliveryBoys.length === 0
          ? <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, padding: 32, color: "var(--adm-muted)", fontSize: 13, textAlign: "center" }}>
            No delivery personnel. Run <code style={{ fontSize: 11, background: "var(--adm-surface)", padding: "2px 6px", borderRadius: 4 }}>npx convex run auth:seedAdminAndDelivery</code>
          </div>
          : deliveryBoys.map((b: any) => {
            const bOrders = orders.filter((o: any) => o.assignedDeliveryBoyName === b.name);
            const active = bOrders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length;
            const delivered = bOrders.filter((o: any) => o.status === "delivered").length;
            const todayDel = bOrders.filter((o: any) => o.status === "delivered" && new Date(o.createdAt).getDate() === new Date().getDate()).length;
            return (
              <div key={b._id} style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", boxShadow: "0 4px 12px rgba(22,101,52,0.3)" }}>
                    {b.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--adm-text)" }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "var(--adm-muted)" }}>{b.phone || b.email}</div>
                  </div>
                  <span style={{ background: b.isActive ? "rgba(34,197,94,0.15)" : "var(--adm-surface)", color: b.isActive ? "#22c55e" : "var(--adm-muted)", fontSize: 10, padding: "4px 10px", borderRadius: 20, fontWeight: 700, border: `1px solid ${b.isActive ? "#22c55e40" : "var(--adm-card-border)"}` }}>
                    {b.isActive ? "Online" : "Offline"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[["Today", todayDel, "#22c55e"], ["Active", active, "#f59e0b"], ["Total", delivered, "#3b82f6"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ background: "var(--adm-surface)", borderRadius: 12, padding: "12px 8px", textAlign: "center", border: "1px solid var(--adm-card-border)" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: c as string }}>{v as number}</div>
                      <div style={{ fontSize: 10, color: "var(--adm-muted)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{l as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--adm-card-border)", fontSize: 15, fontWeight: 700, color: "var(--adm-text)" }}>Active Deliveries</div>
        {orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length === 0
          ? <div style={{ padding: 64, textAlign: "center", color: "var(--adm-muted)", fontSize: 14 }}>No active deliveries right now.</div>
          : orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).map((o: any) => (
            <div key={o._id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--adm-card-border)", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                 onMouseEnter={e => e.currentTarget.style.background = "var(--adm-row-hover)"}
                 onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                 onClick={() => setSelectedOrder(o)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--adm-text)" }}>{o.customerName}</div>
                <div style={{ fontSize: 11, color: "var(--adm-muted)", marginTop: 4 }}>{o.deliveryAddress}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge status={o.status} />
                {o.assignedDeliveryBoyName && <div style={{ fontSize: 11, color: "var(--adm-muted)", marginTop: 6, fontWeight: 500 }}>🛵 {o.assignedDeliveryBoyName}</div>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  // ── Customers Tab ─────────────────────────────────────────────
  const CustomersTab = () => {
    const unique = Array.from(new Map(orders.map((o: any) => [o.customerEmail, o])).values());
    return (
      <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, overflow: "hidden", boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)" }} className="fade-in">
        {unique.length === 0
          ? <div style={{ padding: 80, textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>👥</div><div style={{ color: "var(--adm-muted)", fontSize: 14, maxWidth: 300, margin: "0 auto" }}>Customer data appears here after orders are placed on the storefront.</div></div>
          : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead><tr style={{ borderBottom: "1px solid var(--adm-card-border)", background: "var(--adm-surface)" }}>
              {["Customer", "Contact Info", "Order History", "Lifetime Value", "Last Interaction"].map(h => (
                <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 1.2, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {unique.map((o: any, i: number) => {
                const co = orders.filter((x: any) => x.customerEmail === o.customerEmail);
                const spent = co.reduce((s: number, x: any) => s + x.total, 0);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--adm-card-border)", transition: "background 0.2s" }}
                    onMouseEnter={e => (e.currentTarget as any).style.background = "var(--adm-row-hover)"}
                    onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#15803d,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", boxShadow: "0 2px 8px rgba(22,101,52,0.2)" }}>
                          {o.customerName?.charAt(0)}
                        </div>
                        <span style={{ fontSize: 14, color: "var(--adm-text)", fontWeight: 600 }}>{o.customerName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 13, color: "var(--adm-text)" }}>{o.customerEmail}</div>
                      <div style={{ fontSize: 11, color: "var(--adm-muted)", marginTop: 2, fontFamily: "monospace" }}>{o.customerPhone}</div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--adm-surface)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--adm-card-border)" }}>
                        <ShoppingBag size={12} color="#15803d" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--adm-text)" }}>{co.length}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#22c55e" }}>₹{spent.toLocaleString()}</div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 12, color: "var(--adm-muted)" }}>{fmt(o.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>}
      </div>
    );
  };

  // ── User Management Tab (Super Admin only) ────────────────────
  const UsersTab = () => (
    <div className="fade-in">
      {!isSuperAdmin && <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-card-border)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <ShieldCheck size={16} color="#a855f7" /><span style={{ fontSize: 13, color: "var(--adm-muted)" }}>Super Admin access required to manage users.</span>
      </div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "0 0 auto", minWidth: 260 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--adm-muted)" }} />
          <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by name, email..."
            style={{ width: "100%", background: "var(--adm-input-bg)", border: "1px solid var(--adm-input-border)", borderRadius: 12, padding: "10px 14px 10px 36px", color: "var(--adm-text)", fontSize: 13, outline: "none", boxSizing: "border-box", boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.05)" }} />
        </div>
        {isSuperAdmin && <button onClick={() => setShowAddUser(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600, boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
          <UserPlus size={14} /> Add User
        </button>}
      </div>
      <div style={{ background: "var(--adm-card)", border: "1px solid var(--adm-card-border)", borderRadius: 16, overflow: "hidden", boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid var(--adm-card-border)", background: "var(--adm-surface)" }}>
            {["User", "Contact", "Role", "Status", "Joined", "Actions"].map(h => (
              <th key={h} style={{ padding: "14px 18px", textAlign: "left", fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>Loading users...</td></tr>
              : filteredUsers.map((u: any) => (
                <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: u.role === "superadmin" ? "linear-gradient(135deg,#7c3aed,#9333ea)" : u.role === "admin" ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#15803d,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--adm-text)" }}>{u.name}</div>
                        {u.lastLogin && <div style={{ fontSize: 10, color: "var(--adm-muted)" }}>Last: {fmt(u.lastLogin)}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 12, color: "var(--adm-text)" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "var(--adm-muted)", fontFamily: "monospace" }}>{u.phone || "—"}</div>
                  </td>
                  <td style={{ padding: "13px 16px" }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ background: u.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)", color: u.isActive ? "#4ade80" : "#f87171", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt(u.createdAt)}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {isSuperAdmin && <button onClick={() => { setEditUser(u); setEditUserForm({ name: u.name, phone: u.phone || "", role: u.role, isActive: u.isActive, newPassword: "" }); }}
                        style={{ background: "rgba(59,130,246,0.12)", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#60a5fa" }}>
                        <Edit2 size={13} />
                      </button>}
                      {isSuperAdmin && u.role !== "superadmin" && <button onClick={() => deleteUserAction(u._id, u.email)}
                        style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#f87171" }}>
                        <Trash2 size={13} />
                      </button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );

  // ── Activity Log Tab ──────────────────────────────────────────
  const ActivityTab = () => (
    <div style={{ background: "var(--adm-card)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 14, fontWeight: 600, color: "var(--adm-text)" }}>System Activity Log</div>
      {activityLog.length === 0
        ? <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No activity recorded yet.</div>
        : activityLog.map((log: any, i: number) => (
          <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--adm-text)" }}>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>{log.userName}</span>
                {" · "}<span style={{ color: "rgba(255,255,255,0.6)" }}>{log.action}</span>
                {log.target && <span style={{ color: "rgba(255,255,255,0.4)" }}> → {log.target}</span>}
              </div>
              {log.details && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{log.details}</div>}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>{fmt(log.timestamp)}</div>
          </div>
        ))}
    </div>
  );

  const renderTab = () => {
    if (tab === "orders") return <OrdersTab />;
    if (tab === "products") return <ProductsTab />;
    if (tab === "delivery") return <DeliveryTab />;
    if (tab === "customers") return <CustomersTab />;
    if (tab === "users") return <UsersTab />;
    if (tab === "activity") return <ActivityTab />;
    return <Dashboard />;
  };




  const topBtnStyle: React.CSSProperties = {
    background: "var(--adm-ghost-bg)",
    border: "1px solid var(--adm-ghost-border)",
    borderRadius: 8,
    color: "var(--adm-text)",
    cursor: "pointer",
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
  };

  return (
    <div style={{ ...adminTheme, display: "flex", flexDirection: "column", height: "100vh", background: "var(--adm-bg)", fontFamily: "'DM Sans',system-ui,sans-serif", color: "var(--adm-text)", overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.25s ease-out} *{box-sizing:border-box;}`}</style>

      {/* MATCH SUPERADMIN HEADER STRUCTURE */}
      <div style={{ flexShrink: 0, zIndex: 60, borderBottom: "1px solid var(--adm-panel-border)", background: "var(--adm-topbar)" }}>
        {/* Top Information Strip */}
        <div style={{ background: isDarkMode ? "#14532d" : "#166534", color: "#dcfce7", fontSize: 11, padding: "4px 12px", textAlign: "center", fontFamily: "monospace", letterSpacing: 0.4 }}>
          {isSuperAdmin ? "Super Admin Control Center" : "Admin operations · Orders, catalog, users · Serving Delhi NCR"}
        </div>

        {/* Main Header Area */}
        <div style={{ width: "100%", padding: isMobile ? "8px 10px" : "10px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {/* Brand Section */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                <img src="/images/Vegfru.png" alt="VegFru Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--adm-text)", letterSpacing: "-0.3px" }}>Veg<span style={{ color: "#16a34a" }}>Fru</span></div>
                <div style={{ fontSize: 9, color: "var(--adm-muted)", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase" }}>
                  {isSuperAdmin ? "Super Admin" : "Admin Panel"}
                </div>
              </div>
            </div>

            {/* Left Controls (Toggle + Title) */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, overflow: "hidden", flex: isMobile ? "0 0 auto" : 1 }}>
                <button type="button" onClick={() => { setNotifOpen(false); setProfileOpen(false); setSidebarOpen(!sidebarOpen); }} style={topBtnStyle}>
                  {isMobile ? <Menu size={18} /> : <LayoutDashboard size={18} />}
                </button>
                <div style={{ minWidth: 0 }}>
                  {!isMobile && <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--adm-text)", margin: 0 }}>{NAV.find(n => n.id === tab)?.label}</h1>}
                  {!isMobile && <div style={{ fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace" }}>{new Date().toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
              <button type="button" onClick={toggleTheme} title={isDarkMode ? "Light mode" : "Dark mode"} style={topBtnStyle}>
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {!isMobile && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20, padding: "4px 10px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 8px #16a34a" }} />
                  <span style={{ fontSize: 10, color: "#15803d", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600 }}>LIVE</span>
                </div>
              )}

              <button type="button" onClick={loadAll} style={{ ...topBtnStyle, gap: 6, fontSize: 12 }}>
                <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </button>

              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => { setProfileOpen(false); setNotifOpen(!notifOpen); }} style={{ ...topBtnStyle, position: "relative" }}>
                  <Bell size={15} />
                  {pendingOrders.length > 0 && <span style={{ position: "absolute", top: -3, right: -3, width: 14, height: 14, background: "#ef4444", borderRadius: "50%", fontSize: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{pendingOrders.length}</span>}
                </button>
                {notifOpen && (
                  <div style={{
                    position: isMobile ? "fixed" : "absolute",
                    right: isMobile ? 10 : 0,
                    top: isMobile ? 88 : "calc(100% + 8px)",
                    width: isMobile ? "calc(100vw - 20px)" : 300,
                    background: "var(--adm-modal-bg)",
                    border: "1px solid var(--adm-modal-border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    zIndex: 180,
                    boxShadow: "var(--adm-modal-shadow)"
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--adm-card-border)", fontSize: 13, fontWeight: 600, color: "var(--adm-text)", display: "flex", justifyContent: "space-between" }}>
                      Notifications <span style={{ fontSize: 11, color: "#22c55e" }}>{pendingOrders.length} pending</span>
                    </div>
                    {pendingOrders.length === 0
                      ? <div style={{ padding: 20, textAlign: "center", color: "var(--adm-muted)", fontSize: 13 }}>All caught up!</div>
                      : pendingOrders.slice(0, 5).map(o => (
                        <div key={o._id} onClick={() => { setSelectedOrder(o); setNotifOpen(false); setTab("orders"); }}
                          style={{ padding: "11px 16px", borderBottom: "1px solid var(--adm-card-border)", cursor: "pointer", display: "flex", gap: 10 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--adm-row-hover)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", marginTop: 5, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, color: "var(--adm-text)" }}>{o.customerName} · <span style={{ color: "#22c55e" }}>₹{o.total}</span></div>
                            <div style={{ fontSize: 11, color: "var(--adm-muted)" }}>{fmt(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => { setNotifOpen(false); setProfileOpen(!profileOpen); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--adm-ghost-bg)", border: "1px solid var(--adm-ghost-border)", borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
                  <div style={{ width: 26, height: 26, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {(adminUser?.name || "A").charAt(0).toUpperCase()}
                  </div>
                  {!isMobile && <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--adm-text)" }}>{adminUser?.name || "Admin"}</div>
                    <div style={{ fontSize: 9, color: "var(--adm-muted)" }}>{adminUser?.role || "admin"}</div>
                  </div>}
                  <ChevronDown size={11} style={{ color: "var(--adm-muted)" }} />
                </button>
                {profileOpen && (
                  <div style={{
                    position: isMobile ? "fixed" : "absolute",
                    right: isMobile ? 10 : 0,
                    top: isMobile ? 88 : "calc(100% + 8px)",
                    width: isMobile ? 220 : 248,
                    background: "var(--adm-modal-bg)",
                    border: "1px solid var(--adm-modal-border)",
                    borderRadius: 12,
                    overflow: "hidden",
                    zIndex: 190,
                    boxShadow: "var(--adm-modal-shadow)"
                  }}>
                    <div style={{ padding: isMobile ? "12px 14px" : "14px 16px", borderBottom: "1px solid var(--adm-card-border)" }}>
                      <div style={{ fontSize: 13, color: "var(--adm-text)", fontWeight: 600 }}>{adminUser?.name}</div>
                      <div style={{ fontSize: 11, color: "var(--adm-muted)", marginTop: 2 }}>{adminUser?.email}</div>
                      <div style={{ marginTop: 8, display: "inline-flex" }}><RoleBadge role={adminUser?.role} /></div>
                    </div>
                    <div style={{ padding: 8 }}>
                      <button type="button" onClick={signOutAdmin}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, borderRadius: 8, textAlign: "left" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Sidebar />
        {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 120 }} />}
        {isMobile && (profileOpen || notifOpen) && <button type="button" onClick={() => { setProfileOpen(false); setNotifOpen(false); }} aria-label="Close popovers" style={{ position: "fixed", inset: 0, background: "transparent", border: "none", zIndex: 170 }} />}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <main style={{ flex: 1, overflow: "auto", padding: isMobile ? 12 : 24 }}>
            {renderTab()}
          </main>
        </div>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "ok" ? "#15803d" : "#ef4444",
          color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontWeight: 600,
          zIndex: 999, boxShadow: isDarkMode ? "0 12px 32px rgba(0,0,0,0.5)" : "0 12px 32px rgba(22,101,52,0.15)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "fade-up 0.3s ease"
        }}>
          {toast.type === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && <Modal title={`Order #${selectedOrder._id?.slice(-6).toUpperCase()}`} onClose={() => setSelectedOrder(null)}>
        <div style={{ marginBottom: 16 }}><Badge status={selectedOrder.status} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[["Customer", selectedOrder.customerName], ["Phone", selectedOrder.customerPhone], ["Payment", selectedOrder.paymentMethod?.toUpperCase()], ["Total", `₹${selectedOrder.total}`], ["Pay Status", selectedOrder.paymentStatus], ["Placed", fmt(selectedOrder.createdAt)]].map(([k, v]) => (
            <div key={k} style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-card-border)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, color: "var(--adm-text)", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-card-border)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", marginBottom: 3 }}>ADDRESS</div>
          <div style={{ fontSize: 12, color: "var(--adm-text)" }}>{selectedOrder.deliveryAddress}</div>
        </div>
        {selectedOrder.assignedDeliveryBoyName && <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", marginBottom: 3 }}>DELIVERY BOY</div>
          <div style={{ fontSize: 13, color: "#16a34a" }}>🛵 {selectedOrder.assignedDeliveryBoyName}</div>
        </div>}
        {!["delivered", "cancelled"].includes(selectedOrder.status) && (
          <div>
            <div style={{ fontSize: 10, color: "var(--adm-muted)", fontFamily: "monospace", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.2 }}>Update Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["confirmed", "preparing", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"] as OrderStatus[]).filter(s => s !== selectedOrder.status).map(s => (
                <button key={s} onClick={async () => {
                  await (s === "cancelled" ? cancelOrder(selectedOrder._id) : nextStatus(selectedOrder._id, selectedOrder.status));
                  setSelectedOrder(null);
                }}
                  style={{
                    padding: "7px 13px", borderRadius: 9, fontSize: 12, cursor: "pointer", border: "none", fontWeight: 600,
                    background: s === "cancelled" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                    color: s === "cancelled" ? "#b91c1c" : "#16a34a"
                  }}>
                  → {S[s].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>}

      {assignModal && (() => {
        const order = orders.find(o => o._id === assignModal);
        const boysSorted = [...deliveryBoys].map(b => ({
          ...b,
          dist: getDist(order?.lat, order?.lng, b.lat, b.lng)
        })).sort((a, b) => (a.dist ?? 999999) - (b.dist ?? 999999));

        return <Modal title="Assign Delivery Boy" onClose={() => setAssignModal(null)}>
          {boysSorted.length === 0
            ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No delivery boys in DB.</div>
            : boysSorted.map((b: any, idx) => (
              <button key={b._id} onClick={() => assignDelivery(assignModal, b)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", marginBottom: 8, textAlign: "left", color: "var(--adm-text)", transition: "background 0.15s", position: "relative" }}
                onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(34,197,94,0.08)"}
                onMouseLeave={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.04)"}>
                <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{b.name?.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{b.phone || b.email}</div>
                </div>
                {b.dist != null && <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: idx === 0 ? "#22c55e" : "var(--adm-text)" }}>{b.dist.toFixed(1)} km</div>
                  {idx === 0 && <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 800, textTransform: "uppercase" }}>NEAREST</span>}
                </div>}
              </button>
            ))}
        </Modal>;
      })()}

      {/* Add Product Modal */}
      {showAddProduct && <Modal title="Add New Product" onClose={() => setShowAddProduct(false)}>
        <FormField label="Product Name" value={newProd.name} onChange={(v: string) => setNewProd(p => ({ ...p, name: v }))} placeholder="Cherry Tomatoes" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Emoji" value={newProd.emoji} onChange={(v: string) => setNewProd(p => ({ ...p, emoji: v }))} placeholder="🥬" />
          <FormField label="Unit" value={newProd.unit} onChange={(v: string) => setNewProd(p => ({ ...p, unit: v }))} placeholder="500g" />
          <FormField label="Price (₹)" value={newProd.price} onChange={(v: string) => setNewProd(p => ({ ...p, price: v }))} type="number" placeholder="49" required />
          <FormField label="Original Price (₹)" value={newProd.originalPrice} onChange={(v: string) => setNewProd(p => ({ ...p, originalPrice: v }))} type="number" placeholder="65" />
          <FormField label="Stock Qty" value={newProd.stock} onChange={(v: string) => setNewProd(p => ({ ...p, stock: v }))} type="number" placeholder="50" />
          <FormField label="Tag" value={newProd.tag} onChange={(v: string) => setNewProd(p => ({ ...p, tag: v }))} placeholder="Organic" />
        </div>
        <SelectField label="Category" value={newProd.category} onChange={(v: string) => setNewProd(p => ({ ...p, category: v }))}
          options={["vegetables", "fruits", "herbs", "exotic", "seasonal", "leafy", "berries", "citrus", "root"]} />
        <FormField label="Description" value={newProd.description} onChange={(v: string) => setNewProd(p => ({ ...p, description: v }))} placeholder="Short description" />
        <FormField label="Badge (optional)" value={newProd.badge} onChange={(v: string) => setNewProd(p => ({ ...p, badge: v }))} placeholder="BESTSELLER / SEASONAL" />
        <FormField label="Image URL (optional)" value={newProd.image} onChange={(v: string) => setNewProd(p => ({ ...p, image: v }))} placeholder="https://example.com/product.jpg" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
            Upload Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => { void onNewProductImageFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 12px", color: "var(--adm-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
            You can either paste an image URL or upload an image file.
          </div>
        </div>
        <SubmitBtn label="Save to Convex DB" loading={busy} onClick={addProduct} />
      </Modal>}

      {/* Edit Product Modal */}
      {editProduct && <Modal title={`Edit — ${editProduct.name}`} onClose={() => setEditProduct(null)}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Price (₹)" value={editProdForm.price} onChange={(v: string) => setEditProdForm(f => ({ ...f, price: v }))} type="number" />
          <FormField label="Stock" value={editProdForm.stock} onChange={(v: string) => setEditProdForm(f => ({ ...f, stock: v }))} type="number" />
        </div>
        <FormField label="Badge" value={editProdForm.badge} onChange={(v: string) => setEditProdForm(f => ({ ...f, badge: v }))} placeholder="BESTSELLER..." />
        <FormField label="Description" value={editProdForm.description} onChange={(v: string) => setEditProdForm(f => ({ ...f, description: v }))} />
        <FormField label="Image URL (optional)" value={editProdForm.image} onChange={(v: string) => setEditProdForm(f => ({ ...f, image: v }))} placeholder="https://example.com/product.jpg" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
            Replace Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={e => { void onEditProductImageFile(e.target.files?.[0] || null); e.currentTarget.value = ""; }}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 12px", color: "var(--adm-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
            Paste a new image URL or upload a new image file.
          </div>
        </div>
        <SubmitBtn label="Save Changes" loading={busy} onClick={saveEditProduct} />
      </Modal>}

      {/* Delete Selected Products Modal */}
      {deleteSelectedProductIds && deleteSelectedProductIds.length > 0 && (
        <Modal title="Delete Products?" onClose={() => setDeleteSelectedProductIds(null)}>
          <div style={{ marginBottom: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 14, color: "rgba(255,255,255,0.85)" }}>
            You are deleting <b>{deleteSelectedProductIds.length}</b> product(s). This action cannot be undone.
          </div>
          <SubmitBtn
            label="Delete Permanently"
            loading={busy}
            onClick={confirmDeleteSelectedProducts}
            color="#dc2626"
          />
          <div style={{ height: 10 }} />
          <button
            onClick={() => setDeleteSelectedProductIds(null)}
            style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.65)", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
        </Modal>
      )}

      {/* Add User Modal (Super Admin) */}
      {showAddUser && <Modal title="Add New Admin" onClose={() => setShowAddUser(false)}>
        <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <ShieldCheck size={14} color="#a855f7" /><span style={{ fontSize: 12, color: "#c084fc" }}>Super Admin action — creates admin account in Convex admins table.</span>
        </div>
        <FormField label="Full Name" value={newUser.name} onChange={(v: string) => setNewUser(u => ({ ...u, name: v }))} placeholder="Ravi Kumar" required />
        <FormField label="Email" value={newUser.email} onChange={(v: string) => setNewUser(u => ({ ...u, email: v }))} type="email" placeholder="ravi@vegfru.com" required />
        <FormField label="Password" value={newUser.password} onChange={(v: string) => setNewUser(u => ({ ...u, password: v }))} type="password" placeholder="Min 8 chars" required />
        <SelectField label="Role" value={newUser.role} onChange={(v: string) => setNewUser(u => ({ ...u, role: v }))}
          options={[{ value: "admin", label: "Admin" }, { value: "superadmin", label: "Super Admin" }]} />
        <SubmitBtn label="Create Account" loading={busy} onClick={addUser} color="#7c3aed" />
      </Modal>}

      {/* Edit User Modal */}
      {editUser && <Modal title={`Edit User — ${editUser.name}`} onClose={() => setEditUser(null)}>
        <FormField label="Full Name" value={editUserForm.name} onChange={(v: string) => setEditUserForm(f => ({ ...f, name: v }))} />
        <FormField label="Phone" value={editUserForm.phone} onChange={(v: string) => setEditUserForm(f => ({ ...f, phone: v }))} />
        {isSuperAdmin && editUser.role !== "superadmin" && <SelectField label="Role" value={editUserForm.role} onChange={(v: string) => setEditUserForm(f => ({ ...f, role: v }))}
          options={[{ value: "customer", label: "Customer" }, { value: "delivery", label: "Delivery" }, { value: "admin", label: "Admin" }]} />}
        <FormField label="New Password (optional)" value={editUserForm.newPassword} onChange={(v: string) => setEditUserForm(f => ({ ...f, newPassword: v }))} type="password" placeholder="Leave blank to keep current" />
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={editUserForm.isActive} onChange={e => setEditUserForm(f => ({ ...f, isActive: e.target.checked }))} style={{ accentColor: "#15803d" }} />
            <span style={{ fontSize: 13, color: "var(--adm-text)" }}>Account Active</span>
          </label>
        </div>
        <SubmitBtn label="Save Changes" loading={busy} onClick={saveEditUser} />
      </Modal>}
    </div>
  );
}
