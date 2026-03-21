"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, Truck, Shield,
  LogOut, TrendingUp, AlertCircle, CheckCircle, Clock,
  Plus, Search, Trash2, Edit2, Star, X, Menu, Loader2,
  Bell, Settings, ChevronDown, Filter, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Eye, EyeOff, UserPlus,
  BarChart3, Activity, ShieldCheck, IndianRupee, Zap
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

function Badge({ status }: { status: OrderStatus }) {
  const c = S[status] || S.pending;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
    {c.label}
  </span>;
}

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_CFG[role as UserRole] || { label: role, color: "#6b7280", bg: "#f3f4f6" };
  return <span style={{ background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.3px" }}>{c.label}</span>;
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
  return (await r.json()).value;
}

const Modal = ({ title, onClose, children }: any) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "88vh", overflow: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>{title}</span>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 6, display: "flex" }}><X size={16} /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const FormField = ({ label, value, onChange, type = "text", placeholder, required = false }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}{required && " *"}</label>
    <input value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
  </div>
);

const SelectField = ({ label, value, onChange, options }: any) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none" }}>
      {options.map((o: any, idx: number) => <option key={idx} value={o.value || o} style={{ background: "#111827" }}>{o.label || o}</option>)}
    </select>
  </div>
);

const SubmitBtn = ({ label, loading, onClick, color = "#15803d" }: any) => (
  <button onClick={onClick} disabled={loading}
    style={{ width: "100%", background: color, color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1, marginTop: 4 }}>
    {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
    {loading ? "Saving..." : label}
  </button>
);

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
  const [userSearch, setUserSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"ok" | "err">("ok");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [newProd, setNewProd] = useState({ name: "", category: "vegetables", price: "", originalPrice: "", unit: "", emoji: "🥬", stock: "", description: "", tag: "Organic", badge: "" });
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", phone: "", role: "admin" });
  const [editProdForm, setEditProdForm] = useState({ price: "", stock: "", badge: "", description: "" });
  const [editUserForm, setEditUserForm] = useState({ name: "", phone: "", role: "", isActive: true, newPassword: "" });

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

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(""), 3000);
  };

  // Load admin from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("vegfru_admin");
      if (s) setAdminUser(JSON.parse(s));
    } catch { }
  }, []);

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
  const filteredProducts = products.filter(p => p.name?.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

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

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    await cm(CURL, "products:deleteProduct", { id });
    setProducts(prev => prev.filter(p => p._id !== id));
    showToast("Product deleted");
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
      });
      setProducts(prev => prev.map(p => p._id === editProduct._id
        ? { ...p, price: Number(editProdForm.price) || p.price, stock: Number(editProdForm.stock) || p.stock, badge: editProdForm.badge || p.badge } : p));
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
      });
      setShowAddProduct(false);
      setNewProd({ name: "", category: "vegetables", price: "", originalPrice: "", unit: "", emoji: "🥬", stock: "", description: "", tag: "Organic", badge: "" });
      await loadAll(); showToast("Product added to database");
    } catch { showToast("Add failed", "err"); }
    setBusy(false);
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
      width: sidebarOpen ? 240 : 68, flexShrink: 0,
      background: "linear-gradient(180deg,#0d1117 0%,#0f172a 100%)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease", overflow: "hidden", position: "relative"
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, height: 72 }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: "0 4px 12px rgba(22,101,52,0.4)" }}>🌿</div>
        {sidebarOpen && <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.3px" }}>Veg<span style={{ color: "#4ade80" }}>Fru</span></div>
          <div style={{ fontSize: 9, color: "#22c55e", letterSpacing: 3, textTransform: "uppercase", fontFamily: "monospace", marginTop: 1 }}>
            {isSuperAdmin ? "Super Admin" : "Admin Panel"}
          </div>
        </div>}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV.filter(n => !n.superOnly || isSuperAdmin).map(({ id, label, icon: Icon, superOnly }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                borderRadius: 10, border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                fontSize: 13, fontWeight: active ? 600 : 400, transition: "all 0.15s",
                background: active ? "linear-gradient(135deg,#15803d,#166534)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.45)",
                boxShadow: active ? "0 2px 8px rgba(22,101,52,0.35)" : "none",
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
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => { localStorage.removeItem("vegfru_admin"); window.location.href = "/admin/login"; }}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", width: "100%", fontSize: 13, transition: "all 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as any).style.color = "#f87171" }}
          onMouseLeave={e => { (e.currentTarget as any).style.background = "transparent"; (e.currentTarget as any).style.color = "rgba(255,255,255,0.3)" }}>
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {sidebarOpen && "Sign Out"}
        </button>
      </div>
    </aside>
  );

  // ── Topbar ───────────────────────────────────────────────────
  const Topbar = () => (
    <header style={{
      height: 64, background: "#0d1117",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", flexShrink: 0, position: "sticky", top: 0, zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
          <Menu size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 600, color: "#f1f5f9", margin: 0 }}>{NAV.find(n => n.id === tab)?.label || "Dashboard"}</h1>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, padding: "5px 12px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
          <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>LIVE</span>
        </div>

        {/* Refresh */}
        <button onClick={loadAll} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: "6px 10px", display: "flex", alignItems: "center", gap: 2, position: "relative" }}>
            <Bell size={15} />
            {pendingOrders.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, background: "#ef4444", borderRadius: "50%", fontSize: 9, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{pendingOrders.length}</span>}
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, width: 300, background: "#1a1d27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>Notifications</div>
              {pendingOrders.length === 0
                ? <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>All caught up!</div>
                : pendingOrders.slice(0, 5).map(o => (
                  <div key={o._id} onClick={() => { setSelectedOrder(o); setNotifOpen(false); setTab("orders"); }}
                    style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>New order · ₹{o.total} · {fmt(o.createdAt)}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setProfileOpen(!profileOpen)} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 12px", cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {(adminUser?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{adminUser?.name || "Admin"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{adminUser?.role || "admin"}</div>
            </div>
            <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
          {profileOpen && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 8, width: 200, background: "#1a1d27", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden", zIndex: 50, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 500 }}>{adminUser?.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{adminUser?.email}</div>
                {adminUser && <RoleBadge role={adminUser.role} />}
              </div>
              <div style={{ padding: 8 }}>
                <button onClick={() => { localStorage.removeItem("vegfru_admin"); window.location.href = "/admin/login"; }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "transparent", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13, borderRadius: 8, textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(239,68,68,0.1)"}
                  onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // ── Dashboard ─────────────────────────────────────────────────
  const Dashboard = () => {
    const rev = orders.filter(o => o.status === "delivered").reduce((s: number, o: any) => s + o.total, 0);
    const todayOrders = orders.filter(o => Date.now() - o.createdAt < 86400000);
    const lowStock = products.filter(p => p.stock < 10 && p.isActive);
    const weekRev = orders.filter(o => Date.now() - o.createdAt < 7 * 86400000 && o.status === "delivered").reduce((s: number, o: any) => s + o.total, 0);

    return <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {[
          { label: "Total Revenue", value: `₹${rev.toLocaleString()}`, sub: `₹${weekRev.toLocaleString()} this week`, icon: IndianRupee, color: "#22c55e" },
          { label: "Total Orders", value: orders.length, sub: `${orders.filter(o => o.status === "pending").length} pending`, icon: ShoppingBag, color: "#3b82f6" },
          { label: "Today's Orders", value: todayOrders.length, sub: `${todayOrders.filter(o => o.status === "delivered").length} delivered`, icon: Zap, color: "#a855f7" },
          { label: "Low Stock Items", value: lowStock.length, sub: "need restocking", icon: AlertCircle, color: "#f59e0b" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" }}>{value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: color, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>
        {/* Recent orders */}
        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Recent Orders</span>
            <button onClick={() => setTab("orders")} style={{ fontSize: 12, color: "#4ade80", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {loading
            ? <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Loading...</div>
            : orders.length === 0
              ? <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No orders yet. Orders from the storefront appear here in real time.</div>
              </div>
              : orders.slice(0, 7).map((o: any) => (
                <div key={o._id} onClick={() => setSelectedOrder(o)}
                  style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
                    #{o._id?.slice(-3).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmt(o.createdAt)} · {o.paymentMethod?.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>₹{o.total}</div>
                    <Badge status={o.status} />
                  </div>
                </div>
              ))}
        </div>

      </div>

      {/* Revenue 7-day chart - OUTSIDE the 2-col grid */}
      {revenueData.length > 0 && <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 16 }}>Revenue — Last 7 Days</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80 }}>
          {revenueData.map((d: any) => {
            const maxR = Math.max(...revenueData.map((x: any) => x.revenue), 1);
            const pct = d.revenue / maxR;
            const label = new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" });
            return (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}</div>
                <div style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 56, display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", background: "linear-gradient(180deg,#22c55e,#15803d)", borderRadius: 6, height: `${Math.max(pct * 100, 4)}%`, transition: "height 0.5s" }} />
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        {/* Left side - order breakdown */}
        <div>
          {/* Stats per status */}
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>Order Breakdown</div>
            {Object.entries(S).map(([status, cfg]) => {
              const count = orders.filter((o: any) => o.status === status).length;
              const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
              return count > 0 ? (
                <div key={status} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 20 }}>
                    <div style={{ height: "100%", background: cfg.color, borderRadius: 20, width: `${pct}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Low stock */}
          <div style={{ background: "#111827", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertCircle size={15} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>Low Stock Alert ({lowStock.length})</span>
            </div>
            {lowStock.length === 0
              ? <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "8px 0" }}>All products well stocked</div>
              : lowStock.slice(0, 6).map((p: any) => (
                <div key={p._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 18 }}>{p.emoji}</span>
                  <div style={{ flex: 1, fontSize: 12, color: "#e2e8f0" }}>{p.name}</div>
                  <span style={{ fontSize: 11, color: p.stock === 0 ? "#ef4444" : "#f59e0b", fontFamily: "monospace", fontWeight: 700 }}>{p.stock} left</span>
                </div>
              ))}
          </div>

          {/* Quick stats */}
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>Order Status Breakdown</div>
            {Object.entries(S).map(([status, cfg]) => {
              const count = orders.filter((o: any) => o.status === status).length;
              const pct = orders.length ? Math.round((count / orders.length) * 100) : 0;
              return count > 0 ? (
                <div key={status} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{cfg.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 20 }}>
                    <div style={{ height: "100%", background: cfg.color, borderRadius: 20, width: `${pct}%`, transition: "width 0.5s" }} />
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>;
  };

  // ── Orders Tab ────────────────────────────────────────────────
  const OrdersTab = () => (
    <div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search orders, customers, phone..."
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px 8px 32px", color: "#e2e8f0", fontSize: 13, width: 280, outline: "none" }} />
        </div>
        {orderSearch && <button onClick={() => setOrderSearch("")} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "6px 12px", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>Clear</button>}
        <button onClick={exportOrdersCSV} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 14px", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>
          <Download size={13} /> Export CSV
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["all", "pending", "confirmed", "preparing", "assigned", "out_for_delivery", "delivered", "cancelled"].map(s => (
          <button key={s} onClick={() => setOrderFilter(s)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              background: orderFilter === s ? "#15803d" : "rgba(255,255,255,0.04)",
              color: orderFilter === s ? "#fff" : "rgba(255,255,255,0.4)",
              border: orderFilter === s ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.15s",
            }}>
            {s === "all" ? `All (${orders.length})` : `${S[s as OrderStatus]?.label || s} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Order", "Customer", "Address", "Amount", "Payment", "Status", "Time", "Actions"].map(h => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
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
                    <tr key={o._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.1s" }}
                      onClick={() => setSelectedOrder(o)}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>#{o._id?.slice(-6).toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{o.customerName}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{o.customerPhone}</div>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 11, color: "rgba(255,255,255,0.3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.deliveryAddress}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>₹{o.total}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{o.deliveryFee > 0 ? `+₹${o.deliveryFee} del` : "Free del"}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{o.paymentMethod?.toUpperCase()}</span>
                        <div style={{ fontSize: 10, color: o.paymentStatus === "paid" ? "#4ade80" : "#f59e0b", marginTop: 3 }}>{o.paymentStatus}</div>
                      </td>
                      <td style={{ padding: "13px 16px" }}><Badge status={o.status} /></td>
                      <td style={{ padding: "13px 16px", fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{fmt(o.createdAt)}</td>
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

  // ── Products Tab ──────────────────────────────────────────────
  const ProductsTab = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
            placeholder={`Search ${products.length} products...`}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px 8px 32px", color: "#e2e8f0", fontSize: 13, width: 240, outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isSuperAdmin && <button onClick={() => setShowAddProduct(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#15803d", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <Plus size={14} /> Add Product
          </button>}
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Product", "Category", "Price", "Stock", "Rating", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Loading products...</div>
                </td></tr>
                : filteredProducts.length === 0
                  ? <tr><td colSpan={7} style={{ padding: 48, textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No products yet. Run <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>npx convex run products:seedProducts</code></div>
                  </td></tr>
                  : filteredProducts.map((p: any) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{p.emoji}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{p.category}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>₹{p.price}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textDecoration: "line-through" }}>₹{p.originalPrice}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: p.stock === 0 ? "#ef4444" : p.stock < 10 ? "#f59e0b" : "#4ade80" }}>{p.stock}</span>
                        {p.stock < 10 && p.stock > 0 && <span style={{ fontSize: 10, color: "#f59e0b", marginLeft: 4 }}>⚠ Low</span>}
                        {p.stock === 0 && <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 4 }}>⛔ Out</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={11} color="#f59e0b" fill="#f59e0b" />
                          <span style={{ fontSize: 13, color: "#e2e8f0" }}>{p.rating?.toFixed(1) || "—"}</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>({p.reviews || 0})</span>
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
                          <button onClick={() => { setEditProduct(p); setEditProdForm({ price: String(p.price), stock: String(p.stock), badge: p.badge || "", description: p.description || "" }); }}
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
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginBottom: 20 }}>
        {deliveryBoys.length === 0
          ? <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            No delivery personnel. Run <code style={{ fontSize: 11 }}>npx convex run auth:seedAdminAndDelivery</code>
          </div>
          : deliveryBoys.map((b: any) => {
            const bOrders = orders.filter((o: any) => o.assignedDeliveryBoyName === b.name);
            const active = bOrders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length;
            const delivered = bOrders.filter((o: any) => o.status === "delivered").length;
            const todayDel = bOrders.filter((o: any) => o.status === "delivered" && Date.now() - o.createdAt < 86400000).length;
            return (
              <div key={b._id} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                    {b.name?.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{b.phone || b.email}</div>
                  </div>
                  <span style={{ background: b.isActive ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", color: b.isActive ? "#4ade80" : "rgba(255,255,255,0.3)", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontWeight: 600 }}>
                    {b.isActive ? "Online" : "Offline"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[["Today", todayDel, "#4ade80"], ["Active", active, "#f59e0b"], ["Total", delivered, "#60a5fa"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: c as string }}>{v as number}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{l as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>Active Deliveries</div>
        {orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length === 0
          ? <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No active deliveries right now.</div>
          : orders.filter((o: any) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).map((o: any) => (
            <div key={o._id} style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{o.customerName}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{o.deliveryAddress}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge status={o.status} />
                {o.assignedDeliveryBoyName && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>🛵 {o.assignedDeliveryBoyName}</div>}
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
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        {unique.length === 0
          ? <div style={{ padding: 48, textAlign: "center" }}><div style={{ fontSize: 40, marginBottom: 10 }}>👥</div><div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Customer data appears here after orders are placed on the storefront.</div></div>
          : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Customer", "Contact", "Orders", "Spent", "Last Order"].map(h => (
                <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {unique.map((o: any, i: number) => {
                const co = orders.filter((x: any) => x.customerEmail === o.customerEmail);
                const spent = co.reduce((s: number, x: any) => s + x.total, 0);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as any).style.background = "transparent"}>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#15803d,#166534)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                          {o.customerName?.charAt(0)}
                        </div>
                        <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{o.customerName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{o.customerEmail}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{o.customerPhone}</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{co.length}</td>
                    <td style={{ padding: "13px 16px", fontSize: 14, fontWeight: 700, color: "#4ade80" }}>₹{spent.toLocaleString()}</td>
                    <td style={{ padding: "13px 16px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{fmt(o.createdAt)}</td>
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
    <div>
      {!isSuperAdmin && <div style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <ShieldCheck size={16} color="#a855f7" /><span style={{ fontSize: 13, color: "#c084fc" }}>Super Admin access required to manage users.</span>
      </div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..."
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px 8px 32px", color: "#e2e8f0", fontSize: 13, width: 240, outline: "none" }} />
        </div>
        {isSuperAdmin && <button onClick={() => setShowAddUser(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
          <UserPlus size={14} /> Add User
        </button>}
      </div>
      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["User", "Contact", "Role", "Status", "Joined", "Actions"].map(h => (
              <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
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
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{u.name}</div>
                        {u.lastLogin && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Last: {fmt(u.lastLogin)}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>{u.phone || "—"}</div>
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
    <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>System Activity Log</div>
      {activityLog.length === 0
        ? <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No activity recorded yet.</div>
        : activityLog.map((log: any, i: number) => (
          <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#e2e8f0" }}>
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

  const TABS: Record<string, React.ReactElement> = {
    dashboard: <Dashboard />, orders: <OrdersTab />, products: <ProductsTab />,
    delivery: <DeliveryTab />, customers: <CustomersTab />, users: <UsersTab />, activity: <ActivityTab />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0d14", fontFamily: "'DM Sans',system-ui,sans-serif", color: "#e2e8f0", overflow: "hidden" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box;}`}</style>
      <VegFruBrandBar subtitle={isSuperAdmin ? "Super Admin · Farm Fresh" : "Admin · Farm Fresh"} />
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Topbar />
        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {TABS[tab] || <Dashboard />}
        </main>
      </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: toastType === "ok" ? "#15803d" : "#dc2626", color: "#fff", padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 8 }}>
        {toastType === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}{toast}
      </div>}

      {/* Order Detail Modal */}
      {selectedOrder && <Modal title={`Order #${selectedOrder._id?.slice(-6).toUpperCase()}`} onClose={() => setSelectedOrder(null)}>
        <div style={{ marginBottom: 16 }}><Badge status={selectedOrder.status} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[["Customer", selectedOrder.customerName], ["Phone", selectedOrder.customerPhone], ["Payment", selectedOrder.paymentMethod?.toUpperCase()], ["Total", `₹${selectedOrder.total}`], ["Pay Status", selectedOrder.paymentStatus], ["Placed", fmt(selectedOrder.createdAt)]].map(([k, v]) => (
            <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginBottom: 3 }}>ADDRESS</div>
          <div style={{ fontSize: 12, color: "#e2e8f0" }}>{selectedOrder.deliveryAddress}</div>
        </div>
        {selectedOrder.assignedDeliveryBoyName && <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginBottom: 3 }}>DELIVERY BOY</div>
          <div style={{ fontSize: 13, color: "#4ade80" }}>🛵 {selectedOrder.assignedDeliveryBoyName}</div>
        </div>}
        {!["delivered", "cancelled"].includes(selectedOrder.status) && (
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginBottom: 8, textTransform: "uppercase" }}>Update Status</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["confirmed", "preparing", "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"] as OrderStatus[]).filter(s => s !== selectedOrder.status).map(s => (
                <button key={s} onClick={async () => {
                  await (s === "cancelled" ? cancelOrder(selectedOrder._id) : nextStatus(selectedOrder._id, selectedOrder.status));
                  setSelectedOrder(null);
                }}
                  style={{
                    padding: "7px 13px", borderRadius: 9, fontSize: 12, cursor: "pointer", border: "none", fontWeight: 500,
                    background: s === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.12)",
                    color: s === "cancelled" ? "#f87171" : "#4ade80"
                  }}>
                  → {S[s].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>}

      {/* Assign Delivery Modal */}
      {assignModal && <Modal title="Assign Delivery Boy" onClose={() => setAssignModal(null)}>
        {deliveryBoys.length === 0
          ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No delivery boys in DB.</div>
          : deliveryBoys.map((b: any) => (
            <button key={b._id} onClick={() => assignDelivery(assignModal, b)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", marginBottom: 8, textAlign: "left", color: "#e2e8f0", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget as any).style.background = "rgba(34,197,94,0.08)"}
              onMouseLeave={e => (e.currentTarget as any).style.background = "rgba(255,255,255,0.04)"}>
              <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{b.name?.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{b.phone || b.email}</div>
              </div>
            </button>
          ))}
      </Modal>}

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
        <SubmitBtn label="Save Changes" loading={busy} onClick={saveEditProduct} />
      </Modal>}

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
            <span style={{ fontSize: 13, color: "#e2e8f0" }}>Account Active</span>
          </label>
        </div>
        <SubmitBtn label="Save Changes" loading={busy} onClick={saveEditUser} />
      </Modal>}
    </div>
  );
}
