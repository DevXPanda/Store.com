"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck, Lock } from "lucide-react";

export default function SuperAdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const u = document.cookie.split(";").find(c => c.trim().startsWith("sa_user="));
    if (u) {
      try {
        const user = JSON.parse(decodeURIComponent(u.split("=")[1]));
        if (user.role === "superadmin") router.replace("/superadmin");
      } catch {}
    }
  }, [router]);

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Please fill all fields"); return; }
    if (attempts >= 5) { setError("Too many attempts. Wait 15 minutes."); return; }
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success && data.user?.role === "superadmin") {
        const encoded = encodeURIComponent(JSON.stringify(data.user));
        document.cookie = `sa_token=${data.token};path=/;max-age=${8*3600};samesite=strict`;
        document.cookie = `sa_user=${encoded};path=/;max-age=${8*3600};samesite=strict`;
        localStorage.setItem("vegfru_superadmin", JSON.stringify(data.user));
        router.push("/superadmin");
      } else {
        setAttempts(a => a + 1);
        setError(data.error || "Invalid credentials. Only superadmin accounts allowed.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(88,28,135,0.15) 0%, #060810 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',system-ui,sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Grid bg */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(0deg,#a855f7 0,#a855f7 1px,transparent 0,transparent 60px),repeating-linear-gradient(90deg,#a855f7 0,#a855f7 1px,transparent 0,transparent 60px)", pointerEvents: "none" }} />
      {/* Glow orb */}
      <div style={{ position: "fixed", top: "-100px", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse,rgba(88,28,135,0.2) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Header badge */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 8px #a855f7" }} />
            <span style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace", letterSpacing: 2 }}>SUPERADMIN PORTAL</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>
            Veg<span style={{ color: "#4ade80" }}>Fru</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>God-mode control panel</div>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 24, backdropFilter: "blur(20px)", overflow: "hidden" }}>
          {/* Purple header stripe */}
          <div style={{ height: 3, background: "linear-gradient(90deg,#7c3aed,#a855f7,#c084fc,#a855f7,#7c3aed)", backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

          <div style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#7c3aed,#9333ea)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
                <ShieldCheck size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#f1f5f9" }}>Super Admin Access</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Session expires in 8 hours</div>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "11px 14px", marginBottom: 16, fontSize: 13, color: "#f87171", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}{attempts > 0 && attempts < 5 ? ` (${5 - attempts} attempts left)` : ""}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Email</label>
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  type="email" placeholder="you@example.com" autoComplete="username"
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                  onFocus={e => e.target.style.borderColor = "rgba(168,85,247,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(168,85,247,0.2)"} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
                    style={{ width: "100%", padding: "12px 44px 12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={e => e.target.style.borderColor = "rgba(168,85,247,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(168,85,247,0.2)"} />
                  <button onClick={() => setShowPw(!showPw)} type="button" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button onClick={handleLogin} disabled={loading || attempts >= 5}
                style={{ width: "100%", background: loading ? "rgba(124,58,237,0.6)" : "linear-gradient(135deg,#7c3aed,#9333ea)", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: loading || attempts >= 5 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(124,58,237,0.35)", marginTop: 4 }}>
                {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />Authenticating...</> : <><Lock size={15} />Sign In</>}
              </button>
            </div>
          </div>
        </div>

        {/* Default superadmin */}
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "monospace", letterSpacing: 2, marginBottom: 8 }}>DEFAULT SUPERADMIN</div>
          <button onClick={() => setForm({ email: "satyamkumarpandey4567@gmail.com", password: "Panda@1912" })}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 10, padding: "9px 12px", cursor: "pointer" }}>
            <ShieldCheck size={14} color="#a855f7" />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#c084fc", fontWeight: 500 }}>satyamkumarpandey4567@gmail.com</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>password: Panda@1912</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>↑ Fill</div>
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
          Not a superadmin?{" "}
          <a href={process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001"} style={{ color: "rgba(168,85,247,0.6)", textDecoration: "none" }}>Admin Panel →</a>
        </p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    </div>
  );
}
