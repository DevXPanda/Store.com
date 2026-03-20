"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Phone } from "lucide-react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

const DEMO_BOYS = [
  { email:"ravi@vegfru.com",  password:"delivery123", name:"Ravi Kumar",  phone:"9876543210", rating:4.8 },
  { email:"sunil@vegfru.com", password:"delivery123", name:"Sunil Singh", phone:"9871234567", rating:4.7 },
  { email:"mohan@vegfru.com", password:"delivery123", name:"Mohan Das",   phone:"9812345678", rating:4.9 },
];

export default function DeliveryLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vegfru_delivery_user");
    if (saved) router.replace("/delivery");
  }, [router]);

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Enter email and password"); return; }
    setLoading(true); setError("");

    // Try Convex first
    if (CONVEX_URL) {
      try {
        const res = await fetch(`${CONVEX_URL}/api/query`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: "auth:getUserByEmail", args: { email: form.email } }),
        });
        const data = await res.json();
        const user = data.value;
        if (user && user.role === "delivery" && user.isActive) {
          const bcrypt = await import("bcryptjs");
          const valid = await (bcrypt as any).compare(form.password, user.passwordHash);
          if (valid) {
            const profile = { name: user.name, email: user.email, phone: user.phone || "", id: user._id, rating: 4.8 };
            localStorage.setItem("vegfru_delivery_user", JSON.stringify(profile));
            router.push("/delivery");
            return;
          }
        }
      } catch {}
    }

    // Fallback to demo accounts
    const demo = DEMO_BOYS.find(b => b.email === form.email && b.password === form.password);
    if (demo) {
      localStorage.setItem("vegfru_delivery_user", JSON.stringify(demo));
      router.push("/delivery");
      return;
    }

    setError("Invalid credentials. Use a demo account below.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#020408,#0a0d14,#0d1a0f)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 300, background: "radial-gradient(ellipse,rgba(21,128,61,0.15) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#15803d,#166534)", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 30, boxShadow: "0 12px 32px rgba(22,101,52,0.4)" }}>🛵</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Veg<span style={{ color: "#4ade80" }}>Fru</span> Delivery</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>Delivery Partner Portal</div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(17,24,39,0.85)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: 28, backdropFilter: "blur(20px)" }}>
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#f87171" }}>{error}</div>
          )}

          {[
            { key: "email", label: "Email", type: "email", placeholder: "ravi@vegfru.com" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>{f.label}</label>
              <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                type={f.type} placeholder={f.placeholder}
                style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "rgba(74,222,128,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                type={showPw ? "text" : "password"} placeholder="delivery123"
                style={{ width: "100%", padding: "12px 44px 12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "rgba(74,222,128,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width: "100%", background: "linear-gradient(135deg,#15803d,#166534)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px rgba(22,101,52,0.4)", opacity: loading ? 0.8 : 1 }}>
            {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Logging in..." : "Login →"}
          </button>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop: 14, background: "rgba(17,24,39,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Demo Partners</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DEMO_BOYS.map(b => (
              <button key={b.email} onClick={() => setForm({ email: b.email, password: "delivery123" })}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as any).style.background = "rgba(34,197,94,0.06)"; (e.currentTarget as any).style.borderColor = "rgba(34,197,94,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as any).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as any).style.borderColor = "rgba(255,255,255,0.06)"; }}>
                <div style={{ width: 30, height: 30, background: "rgba(34,197,94,0.12)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{b.name.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{b.email}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "#f59e0b" }}>★</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{b.rating}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Not a delivery partner? <a href="http://localhost:3000" style={{ color: "#4ade80", textDecoration: "none" }}>Go to store →</a>
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
