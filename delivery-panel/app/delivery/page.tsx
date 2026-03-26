"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  Navigation,
  Truck,
  BarChart3,
  User,
  X,
  Loader2,
  ChevronRight,
  IndianRupee,
  Clock,
  RefreshCw,
  LogOut,
  Star,
  History,
  CircleCheck,
  CircleAlert,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { VegFruBrandBar } from "@/components/VegFruBrandBar";

type OrderStatus = "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled";

const STEPS = [
  { key: "assigned", label: "Assigned", icon: "📋", color: "#3b82f6" },
  { key: "picked_up", label: "Picked Up", icon: "📦", color: "#f97316" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵", color: "#0ea5e9" },
  { key: "delivered", label: "Delivered", icon: "✅", color: "#22c55e" },
];

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  assigned: "picked_up",
  picked_up: "out_for_delivery",
  out_for_delivery: "delivered",
};
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  assigned: "Mark Picked Up",
  picked_up: "Start Delivery",
  out_for_delivery: "Confirm Delivered",
};

const CURL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

async function cq(path: string, args: object = {}) {
  if (!CURL) return null;
  try {
    const r = await fetch(`${CURL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    });
    return (await r.json()).value;
  } catch {
    return null;
  }
}
async function cm(path: string, args: object = {}) {
  if (!CURL) return null;
  const r = await fetch(`${CURL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).value;
}

function fmt(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return "just now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  return `${Math.floor(d / 3600000)}h ago`;
}

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export default function DeliveryApp() {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "history" | "stats" | "profile">("active");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deliveryBoy, setDeliveryBoy] = useState({
    name: "",
    email: "",
    phone: "",
    rating: 0,
  });
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", method: "upi" as "upi" | "bank", details: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("vegfru_delivery_user");
    if (!s) {
      router.replace("/?signin=1");
      return;
    }
    try {
      setDeliveryBoy(JSON.parse(s));
    } catch {
      /* ignore */
    }
  }, [router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchOrders = useCallback(async () => {
    const data = await cq("orders:getAllOrders", { limit: 100 });
    if (data) {
      setOrders(
        (data as any[]).filter((o) =>
          ["assigned", "picked_up", "out_for_delivery", "delivered"].includes(o.status)
        )
      );
    }
    const myId = (deliveryBoy as any)._id;
    if (myId) {
      const stats = await cq("orders:getDeliveryStats", { deliveryBoyId: myId });
      if (stats) setBalance((stats as any).balance || 0);
      const myPayouts = await cq("payouts:getMyPayouts", { userId: myId });
      if (myPayouts) setPayouts(myPayouts as any[]);
    }
    setLoading(false);
  }, [deliveryBoy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    const t = setInterval(fetchOrders, 20000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  useEffect(() => {
    if (!online || !(deliveryBoy as any)._id) return;
    const updateLoc = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void cm("auth:updateLocation", { id: (deliveryBoy as any)._id, lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => { /* ignore */ },
        { enableHighAccuracy: true }
      );
    };
    updateLoc();
    const t = setInterval(updateLoc, 60000);
    return () => clearInterval(t);
  }, [online, deliveryBoy]);

  const active = orders.filter((o) => ["assigned", "picked_up", "out_for_delivery"].includes(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const todayDel = delivered.filter((o) => Date.now() - o.createdAt < 86400000);
  const earnings = todayDel.length * 70;

  async function updateStatus(order: any, status: OrderStatus) {
    setUpdating(order._id);
    try {
      await cm("orders:updateOrderStatus", { orderId: order._id, status });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status } : o)));
      if (selectedOrder?._id === order._id) setSelectedOrder((p: any) => (p ? { ...p, status } : null));
      setConfirmOrder(null);
      showToast(status === "delivered" ? "Order delivered! 🎉" : "Status updated");
    } catch {
      showToast("Failed to update");
    }
    setUpdating(null);
  }

  const stepIdx = (o: any) => STEPS.findIndex((s) => s.key === o.status);

  const ActiveTab = () => (
    <div className="px-4 pb-4">
      {loading ? (
        <div className="flex items-center justify-center gap-2.5 py-12 text-muted-foreground">
          <Loader2 size={18} className="animate-spin-slow" />
          Loading orders...
        </div>
      ) : active.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-forest-500/10 text-3xl ring-1 ring-forest-500/20 dark:bg-pink-500/10 dark:ring-pink-500/20">
            🛵
          </div>
          <p className="mb-1.5 text-lg font-semibold text-foreground">No active deliveries</p>
          <p className="text-sm text-muted-foreground">New orders assigned from admin appear here</p>
        </div>
      ) : (
        active.map((order: any) => {
          const si = stepIdx(order);
          const step = STEPS[si];
          return (
            <div
              key={order._id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOrder(order)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedOrder(order)}
              className="mb-3.5 cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-forest-500/35 dark:shadow-none"
            >
              <div className="h-0.5 bg-muted">
                <div
                  className="h-full transition-[width] duration-500"
                  style={{
                    width: `${((si + 1) / STEPS.length) * 100}%`,
                    background: `linear-gradient(90deg,#15803d,${step?.color || "#22c55e"})`,
                  }}
                />
              </div>

              <div className="p-4 md:p-5">
                <div className="mb-3.5 flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold text-card-foreground">{order.customerName}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      #{order._id?.slice(-6).toUpperCase()} · {fmt(order.createdAt)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-forest-600 dark:text-forest-400">₹{order.total}</div>
                    {order.paymentMethod === "cod" && (
                      <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        COLLECT CASH
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3.5 flex items-center">
                  {STEPS.filter((s) => s.key !== "delivered").map((s, i, arr) => {
                    const done = si > i;
                    const cur = si === i;
                    return (
                      <div key={s.key} className={cn("flex items-center", i < arr.length - 1 ? "flex-1" : "")}>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              "flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                              done
                                ? "border-forest-500 bg-forest-700 text-white dark:bg-forest-600"
                                : cur
                                  ? "border-forest-500 bg-forest-500/10 text-forest-600 dark:text-forest-400"
                                  : "border-border bg-muted text-muted-foreground"
                            )}
                          >
                            {done ? "✓" : i + 1}
                          </div>
                          <span
                            className={cn(
                              "whitespace-nowrap text-[9px] font-medium",
                              done || cur ? "text-forest-700 dark:text-forest-400" : "text-muted-foreground"
                            )}
                          >
                            {s.label.split(" ")[0]}
                          </span>
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={cn(
                              "mx-1.5 mb-3.5 h-0.5 flex-1",
                              si > i ? "bg-forest-500" : "bg-border"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mb-3.5 flex items-start gap-2.5 rounded-xl border border-border bg-muted/50 p-2.5 md:p-3">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-forest-600 dark:text-forest-400" />
                  <span className="text-[13px] leading-snug text-card-foreground/90">{order.deliveryAddress}</span>
                </div>

                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex min-w-[100px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-forest-500/25 bg-forest-500/10 py-2.5 text-[13px] font-medium text-forest-800 no-underline transition hover:bg-forest-500/15 dark:text-forest-300"
                  >
                    <Phone size={14} /> Call
                  </a>
                  <a
                    href={order.lat != null && order.lng != null
                      ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.deliveryAddress)}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-[100px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 py-2.5 text-[13px] font-medium text-sky-700 no-underline transition hover:bg-sky-500/15 dark:text-sky-300"
                  >
                    <Navigation size={14} /> Navigate
                  </a>
                  {NEXT[order.status as OrderStatus] && (
                    <button
                      type="button"
                      onClick={() =>
                        order.status === "out_for_delivery"
                          ? setConfirmOrder(order)
                          : updateStatus(order, NEXT[order.status as OrderStatus]!)
                      }
                      disabled={updating === order._id}
                      className="flex min-w-[140px] flex-[2] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-forest-700 to-forest-800 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-forest-900/25 transition hover:opacity-95 disabled:opacity-70 dark:from-forest-600 dark:to-forest-800"
                    >
                      {updating === order._id ? (
                        <Loader2 size={14} className="animate-spin-slow" />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      {NEXT_LABEL[order.status as OrderStatus]}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const HistoryTab = () => (
    <div className="px-4 pb-4">
      {delivered.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <div className="mb-3 text-4xl">📋</div>
          <p className="text-sm text-muted-foreground">No delivery history yet</p>
        </div>
      ) : (
        delivered.map((o: any) => (
          <div
            key={o._id}
            className="mb-2.5 flex items-center gap-3 rounded-2xl border border-forest-500/20 bg-card p-3.5 shadow-sm dark:border-forest-500/15 dark:shadow-none"
          >
            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-forest-500/15 text-lg">
              ✅
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-card-foreground">{o.customerName}</div>
              <div className="truncate text-[11px] text-muted-foreground">{o.deliveryAddress?.split(",")[0]}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground/80">{fmt(o.createdAt)}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[15px] font-bold text-forest-600 dark:text-forest-400">₹{o.total}</div>
              <div className="mt-0.5 text-[11px] text-forest-600 dark:text-forest-400">+₹70 earned</div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const StatsTab = () => {
    const todayStr = new Date().toDateString();
    const deliveredToday = orders.filter((o) => o.status === "delivered" && new Date(o.createdAt).toDateString() === todayStr).length;
    const statsItems = [
      { label: "Today", value: deliveredToday, color: "text-forest-600" },
      { label: "Total Done", value: orders.filter((o) => o.status === "delivered").length, color: "text-blue-600" },
      { label: "Pending", value: orders.filter(o => ["assigned", "picked_up", "out_for_delivery"].includes(o.status)).length, color: "text-amber-600" },
      { label: "Earnings Tag", value: `₹${orders.filter(o => o.status === 'delivered').length * 70}`, color: "text-emerald-700" },
    ];

    const submitPayout = async () => {
      if (!payoutForm.amount || !payoutForm.details) {
        showToast("Please fill all details");
        return;
      }
      const amount = Number(payoutForm.amount);
      if (isNaN(amount) || amount <= 0) {
        showToast("Invalid amount");
        return;
      }
      if (amount > balance) {
        showToast("Insufficient balance");
        return;
      }
      if (amount < 100) {
        showToast("Min payout ₹100");
        return;
      }
      try {
        setUpdating("payout");
        await cm("payouts:requestPayout", {
          userId: (deliveryBoy as any)._id,
          userName: deliveryBoy.name,
          amount,
          method: payoutForm.method,
          details: payoutForm.details,
        });
        showToast("Payout requested successfully");
        setShowPayoutModal(false);
        setPayoutForm({ amount: "", method: "upi", details: "" });
        void fetchOrders();
      } catch (e: any) {
        showToast(e.message);
      } finally {
        setUpdating(null);
      }
    };

    return (
      <div className="flex flex-col gap-5 p-4">
        {/* Balance Card */}
        <div className="rounded-3xl border border-border bg-forest-700 p-6 text-white shadow-lg overflow-hidden relative">
          <div className="relative z-10">
            <div className="opacity-80 text-sm font-medium">Available Payout Balance</div>
            <div className="mt-1 text-4xl font-black">₹{balance}</div>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-bold backdrop-blur-md transition hover:bg-white/30"
            >
              <IndianRupee size={16} /> Request Payout
            </button>
          </div>
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-forest-400/20 blur-2xl" />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {statsItems.map((item) => (
            <div key={item.label} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm dark:shadow-none">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{item.label}</span>
              <span className={cn("mt-1 text-2xl font-black", item.color)}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Payout History */}
        <div className="mt-2">
          <h3 className="mb-3 px-1 text-sm font-bold text-card-foreground">Payout History</h3>
          {payouts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No previous payouts.
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      p.status === "processed" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {p.status === "processed" ? <CircleCheck size={18} /> : p.status === "rejected" ? <CircleAlert size={18} /> : <Clock size={14} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-card-foreground">₹{p.amount}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.method} • {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    p.status === "processed" ? "bg-green-100 text-green-700" : p.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {p.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-4">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold">Request Earned Money</h3>
                <button onClick={() => setShowPayoutModal(false)} className="rounded-full bg-muted/50 p-1.5"><X size={20} /></button>
              </div>
              <div className="mb-6 rounded-2xl bg-forest-50 p-4 dark:bg-forest-900/20">
                <div className="text-xs text-forest-700 dark:text-forest-400">Current Balance</div>
                <div className="text-2xl font-black text-forest-900 dark:text-forest-100">₹{balance}</div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Payout Amount (₹)</label>
                  <input
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    placeholder="Enter amount (min. ₹100)"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-forest-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Receive Through</label>
                  <div className="flex gap-2">
                    {["upi", "bank"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPayoutForm({ ...payoutForm, method: m as any })}
                        className={cn(
                          "flex-1 rounded-xl border py-3 text-xs font-bold uppercase transition",
                          payoutForm.method === m ? "border-forest-500 bg-forest-50 text-forest-700 dark:bg-forest-900/20" : "border-border bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {m === "upi" ? "UPI ID" : "Bank Details"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {payoutForm.method === "upi" ? "Enter UPI ID" : "Account No / IFSC / Name"}
                  </label>
                  <textarea
                    value={payoutForm.details}
                    onChange={(e) => setPayoutForm({ ...payoutForm, details: e.target.value })}
                    placeholder={payoutForm.method === "upi" ? "e.g. yourname@ybl" : "A/C: 1234567890\nIFSC: SBIN0001234\nName: John Doe"}
                    rows={payoutForm.method === "bank" ? 3 : 1}
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm focus:border-forest-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={submitPayout}
                  disabled={!!updating}
                  className="mt-2 w-full rounded-2xl bg-forest-700 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {updating === "payout" ? "Processing..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ProfileTab = () => (
    <div className="px-4 pb-4">
      <div className="mb-3.5 rounded-2xl border border-border bg-card p-6 text-center shadow-sm dark:shadow-none">
        <div className="mx-auto mb-3.5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-forest-700 to-forest-900 text-3xl font-bold text-white shadow-lg shadow-forest-900/30">
          {deliveryBoy.name.charAt(0)}
        </div>
        <div className="text-xl font-bold text-card-foreground">{deliveryBoy.name}</div>
        <div className="mt-1 text-sm text-muted-foreground">{deliveryBoy.email}</div>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-forest-500/25 bg-forest-500/10 px-3.5 py-1">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              online ? "bg-forest-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-muted-foreground/40"
            )}
          />
          <span
            className={cn(
              "text-xs font-semibold",
              online ? "text-forest-800 dark:text-forest-400" : "text-muted-foreground"
            )}
          >
            {online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="mb-3.5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm dark:shadow-none">
        {[
          { icon: Phone, label: "Phone", val: deliveryBoy.phone },
          { icon: User, label: "Email", val: deliveryBoy.email },
          { icon: Star, label: "Rating", val: deliveryBoy.rating > 0 ? `${deliveryBoy.rating}/5.0` : "—" },
          { icon: Truck, label: "Total Delivered", val: `${delivered.length} orders` },
        ].map(({ icon: Icon, label, val }, idx, arr) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3.5",
              idx < arr.length - 1 && "border-b border-border"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-500/10">
              <Icon size={16} className="text-forest-700 dark:text-forest-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-muted-foreground">{label}</div>
              <div className="text-[13px] font-medium text-card-foreground">{val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm dark:shadow-none">
        <div>
          <div className="text-sm font-medium text-card-foreground">Availability</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {online ? "You are visible to admin" : "You won't receive new orders"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOnline(!online)}
          className={cn(
            "relative h-7 w-[50px] shrink-0 rounded-full border-0 transition-colors",
            online ? "bg-forest-700 dark:bg-forest-600" : "bg-muted"
          )}
          aria-pressed={online}
        >
          <span
            className={cn(
              "absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-[left]",
              online ? "left-6" : "left-[3px]"
            )}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("vegfru_delivery_user");
          router.push("/");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 py-3 text-sm font-medium text-destructive transition hover:bg-destructive/15"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  );

  const tabs = [
    { id: "active" as const, label: "Active", icon: Truck },
    { id: "history" as const, label: "History", icon: History },
    { id: "stats" as const, label: "Stats", icon: BarChart3 },
  ];

  const brandRightExtra = (
    <>
      <ThemeToggle variant="header" />
      <button
        type="button"
        onClick={fetchOrders}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-forest-700 transition hover:bg-green-100"
        aria-label="Refresh orders"
        title="Refresh"
      >
        <RefreshCw size={14} className={loading ? "animate-spin-slow" : ""} />
      </button>
      <div className="flex items-center gap-1.5 rounded-full border border-green-300/60 bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-800">
        <div
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            online ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]" : "bg-gray-400"
          )}
        />
        <span>{online ? "ONLINE" : "OFFLINE"}</span>
        {active.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {active.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-yellow-300/60 bg-yellow-400 px-2.5 py-1 text-[11px] font-bold text-yellow-950">
        <span>₹{balance}</span>
      </div>
      <button
        type="button"
        onClick={() => setTab("profile")}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border transition",
          tab === "profile"
            ? "border-forest-300/60 bg-forest-500/15 text-forest-700"
            : "border-green-200 bg-green-50 text-forest-700 hover:bg-green-100"
        )}
        aria-label="Open profile"
        title="Profile"
      >
        <User size={14} />
      </button>
    </>
  );

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col font-body">
      <VegFruBrandBar
        subtitle="Delivery · Farm Fresh"
        rightExtra={brandRightExtra}
      />
      <div className="sticky top-0 z-40 border-b border-white/10 bg-app-header text-header-foreground shadow-md">
        <div className="flex border-b border-white/10 bg-black/5 dark:bg-black/20">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                tab === id
                  ? "border-b-2 border-forest-300 text-forest-100"
                  : "border-b-2 border-transparent text-header-muted hover:text-header-foreground/90"
              )}
            >
              <Icon size={16} strokeWidth={tab === id ? 2.25 : 1.75} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex h-12 items-center justify-between gap-3 px-4 md:h-14 md:px-6">
          <div className="min-w-0 text-[13px] font-semibold text-header-foreground/95">
            Delivery dashboard
          </div>
          <div className="text-[11px] text-header-muted">{active.length} active deliveries</div>
        </div>

        <div className="grid grid-cols-3 gap-1 px-4 pb-3 md:px-6">
          {[
            { label: "Active", val: active.length, color: "text-amber-400 dark:text-amber-400" },
            { label: "Today", val: todayDel.length, color: "text-forest-200 dark:text-forest-300" },
            { label: "Earned", val: `₹${earnings}`, color: "text-forest-200 dark:text-forest-300" },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              className="rounded-lg bg-black/15 px-2 py-2.5 text-center backdrop-blur-sm dark:bg-white/10"
            >
              <div className={cn("text-lg font-bold tabular-nums", color)}>{val}</div>
              <div className="mt-0.5 text-[10px] text-header-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pt-3.5">
        {tab === "active" && <ActiveTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "stats" && <StatsTab />}
        {tab === "profile" && <ProfileTab />}
      </main>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-end bg-black/60 backdrop-blur-sm dark:bg-black/70"
          role="presentation"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[75vh] w-full overflow-auto rounded-t-3xl border border-border bg-popover text-popover-foreground shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-3 h-1 w-9 rounded-full bg-muted-foreground/30" />
            <div className="px-6 pb-6 pt-2">
              <div className="mb-5 flex justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-bold">{selectedOrder.customerName}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    #{selectedOrder._id?.slice(-6).toUpperCase()} · {fmt(selectedOrder.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:bg-muted/80"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-3.5 grid grid-cols-2 gap-2.5">
                {(
                  [
                    ["Phone", selectedOrder.customerPhone],
                    ["Total", `₹${selectedOrder.total}`],
                    ["Payment", selectedOrder.paymentMethod?.toUpperCase()],
                    ["Status", selectedOrder.paymentStatus],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-muted/50 p-2.5 md:p-3">
                    <div className="mb-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {k}
                    </div>
                    <div className="text-[13px] font-medium text-popover-foreground">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-xl border border-border bg-muted/50 p-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Delivery address
                </div>
                <div className="text-[13px] leading-relaxed text-popover-foreground/90">
                  {selectedOrder.deliveryAddress}
                </div>
              </div>

              {selectedOrder.paymentMethod === "cod" &&
                !["delivered", "cancelled"].includes(selectedOrder.status) && (
                  <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 dark:border-amber-500/20">
                    <IndianRupee size={16} className="shrink-0 text-amber-600" />
                    <div>
                      <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        Collect ₹{selectedOrder.total} Cash
                      </div>
                      <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                        Cash on delivery — collect before confirming
                      </div>
                    </div>
                  </div>
                )}

              {NEXT[selectedOrder.status as OrderStatus] && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedOrder.status === "out_for_delivery") {
                      setConfirmOrder(selectedOrder);
                      setSelectedOrder(null);
                    } else {
                      updateStatus(selectedOrder, NEXT[selectedOrder.status as OrderStatus]!);
                      setSelectedOrder(null);
                    }
                  }}
                  className="w-full rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-forest-900/30 transition hover:opacity-95 dark:from-forest-600 dark:to-forest-800"
                >
                  {NEXT_LABEL[selectedOrder.status as OrderStatus]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="w-full max-w-[380px] rounded-3xl border border-border bg-popover p-7 text-popover-foreground shadow-2xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full bg-forest-500/15 text-3xl">
                ✅
              </div>
              <div className="text-lg font-bold">Confirm Delivery</div>
              <div className="mt-1.5 text-sm text-muted-foreground">
                Delivered to {confirmOrder.customerName}?
              </div>
            </div>
            {confirmOrder.paymentMethod === "cod" && (
              <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center dark:border-amber-500/20">
                <div className="text-base font-bold text-amber-800 dark:text-amber-300">
                  Collect ₹{confirmOrder.total}
                </div>
                <div className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-400/70">
                  Cash payment — collect before confirming
                </div>
              </div>
            )}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOrder(null)}
                className="flex-1 rounded-xl border border-border bg-muted py-3 text-sm text-muted-foreground transition hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateStatus(confirmOrder, "delivered")}
                disabled={!!updating}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60 dark:from-forest-600 dark:to-forest-800"
              >
                {updating ? <Loader2 size={14} className="animate-spin-slow" /> : null}
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[999] -translate-x-1/2 rounded-xl bg-forest-800 px-5 py-2.5 text-sm font-medium text-white shadow-xl dark:bg-forest-600">
          {toast}
        </div>
      )}
    </div>
  );
}
