"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, Shield } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label:"Super Admin", email:"superadmin@vegfru.com", password:"superadmin123", role:"superadmin", color:"#a855f7" },
  { label:"Admin",       email:"admin@vegfru.com",      password:"admin123",      role:"admin",      color:"#3b82f6" },
];

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      // Use server-side API route (bcrypt runs on server, not browser)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success && data.user && ["admin","superadmin"].includes(data.user.role)) {
        // Set cookies for middleware
        document.cookie = `vegfru_token=${data.token};path=/;max-age=${7*86400};samesite=strict`;
        document.cookie = `vegfru_user=${JSON.stringify(data.user)};path=/;max-age=${7*86400};samesite=strict`;
        localStorage.setItem("vegfru_admin", JSON.stringify(data.user));
        router.push("/admin");
      } else {
        setError(data.error || "Invalid credentials. Try demo accounts below.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#020408 0%,#0a0d14 50%,#0d1a0f 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translateX(-50%)", width:600, height:300, background:"radial-gradient(ellipse,rgba(21,128,61,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        <div style={{ background:"rgba(17,24,39,0.85)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, backdropFilter:"blur(20px)", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"32px 32px 24px", background:"linear-gradient(135deg,rgba(21,128,61,0.15),rgba(22,101,52,0.08))", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:52, height:52, background:"linear-gradient(135deg,#15803d,#166534)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 8px 24px rgba(22,101,52,0.4)" }}>🌿</div>
              <div>
                <div style={{ fontSize:22, fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.3px" }}>Veg<span style={{ color:"#4ade80" }}>Fru</span></div>
                <div style={{ fontSize:10, color:"#4ade80", letterSpacing:3, textTransform:"uppercase", fontFamily:"monospace" }}>Admin Portal</div>
              </div>
            </div>
            <h1 style={{ fontSize:18, fontWeight:600, color:"#f1f5f9", margin:0 }}>Welcome back</h1>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", margin:"6px 0 0" }}>Sign in to manage your store</p>
          </div>

          <div style={{ padding:28 }}>
            {error && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"11px 14px", marginBottom:16, fontSize:13, color:"#f87171", display:"flex", gap:8, alignItems:"flex-start" }}>
                <AlertCircle size={14} style={{ flexShrink:0, marginTop:1 }} />{error}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase", marginBottom:7 }}>Email</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                type="email" placeholder="admin@vegfru.com"
                style={{ width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor="rgba(74,222,128,0.4)"}
                onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.08)"} />
            </div>

            {/* Password */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase", marginBottom:7 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  type={showPw ? "text" : "password"} placeholder="••••••••"
                  style={{ width:"100%", padding:"12px 44px 12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor="rgba(74,222,128,0.4)"}
                  onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.08)"} />
                <button onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", display:"flex" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              style={{ width:"100%", background:"linear-gradient(135deg,#15803d,#166534)", color:"white", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 16px rgba(22,101,52,0.35)", opacity:loading?0.8:1 }}>
              {loading && <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} />}
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </div>
        </div>

        {/* Demo accounts */}
        <div style={{ marginTop:14, background:"rgba(17,24,39,0.6)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:16, backdropFilter:"blur(10px)" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>Demo Accounts</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.role} onClick={() => setForm({ email:a.email, password:a.password })}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, cursor:"pointer", textAlign:"left", width:"100%", transition:"all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as any).style.background=`${a.color}10`; (e.currentTarget as any).style.borderColor=`${a.color}30` }}
                onMouseLeave={e => { (e.currentTarget as any).style.background="rgba(255,255,255,0.03)"; (e.currentTarget as any).style.borderColor="rgba(255,255,255,0.06)" }}>
                <div style={{ width:28, height:28, background:`${a.color}20`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {a.role === "superadmin" ? <ShieldCheck size={13} color={a.color} /> : <Shield size={13} color={a.color} />}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:a.color }}>{a.label}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontFamily:"monospace" }}>{a.email} / {a.password}</div>
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>↑ Click</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"rgba(255,255,255,0.2)" }}>
          <a href="http://localhost:3000" style={{ color:"rgba(255,255,255,0.25)", textDecoration:"none", marginRight:12 }}>← Store</a>
          <a href="http://localhost:3002" style={{ color:"rgba(255,255,255,0.25)", textDecoration:"none" }}>Delivery →</a>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}
