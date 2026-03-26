"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Leaf,
  ArrowRight,
  Globe,
  Lock,
  Server,
  MapPin,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";

const STORE = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
const ADMIN = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";

export default function PanelHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openSignIn, setOpenSignIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const signin = searchParams.get("signin") === "1";
    if (!signin) {
      setOpenSignIn(false);
      return;
    }
    try {
      const s = localStorage.getItem("vegfru_superadmin");
      if (s) {
        const user = JSON.parse(s);
        if (user?.role === "superadmin") {
          router.replace("/superadmin");
          return;
        }
      }
    } catch {}
    setOpenSignIn(true);
  }, [router, searchParams]);

  const closeModal = () => {
    setOpenSignIn(false);
    setAuthError("");
    setForm({ email: "", password: "" });
    setShowPw(false);
    router.replace("/");
  };

  const handleSignIn = async () => {
    if (!form.email || !form.password) {
      setAuthError("Please fill all fields");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.user?.role === "superadmin") {
        const encoded = encodeURIComponent(JSON.stringify(data.user));
        document.cookie = `sa_token=${data.token};path=/;max-age=${8 * 3600};samesite=strict`;
        document.cookie = `sa_user=${encoded};path=/;max-age=${8 * 3600};samesite=strict`;
        localStorage.setItem("vegfru_superadmin", JSON.stringify(data.user));
        router.push("/superadmin");
        return;
      }
      setAuthError(data.error || "Invalid credentials. Superadmin account required.");
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900">
      <div className="bg-forest-800 text-green-100 text-xs py-1.5 text-center font-body tracking-wide">
        <span className="inline-flex items-center justify-center gap-2 px-4">
          <MapPin className="w-3 h-3 shrink-0" />
          Platform control · Security · global settings
        </span>
      </div>

      <header className="sticky top-0 z-40 bg-[#FEFAE0]/95 backdrop-blur-md border-b border-green-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-12 transition-transform duration-300">
                <Leaf className="w-5 h-5 text-green-200" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-forest-800 tracking-tight">
                  Veg<span className="text-green-600">Fru</span>
                </span>
                <span className="block text-[9px] font-mono text-green-600 tracking-widest uppercase -mt-0.5">
                  Super Admin
                </span>
              </div>
            </a>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-forest-700 transition-colors"
              >
                View storefront
              </a>
              <button
                onClick={() => setOpenSignIn(true)}
                className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-body font-medium px-5 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg active:scale-[0.98]"
              >
                Sign in
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative min-h-[calc(100vh-7rem)] flex items-center overflow-hidden pt-8 pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob-1 absolute -top-32 -left-32 w-96 h-96 bg-green-200/40" />
          <div className="blob-2 absolute -bottom-20 -right-32 w-80 h-80 bg-amber-200/40" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 blob-1 bg-lime-100/60" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #166534 0, #166534 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #166534 0, #166534 1px, transparent 0, transparent 50%)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-forest-700 text-xs font-mono tracking-wider px-4 py-2 rounded-full uppercase">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                VegFru platform
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-forest-900">
                  Govern the stack,
                  <span className="block italic text-forest-600">securely,</span>
                  <span className="block text-green-600">at full control.</span>
                </h1>
              </div>

              <p className="font-body text-gray-600 text-lg leading-relaxed max-w-md">
                User roles, system health, and cross-tenant oversight — reserved for VegFru
                super administrators. This is not the day-to-day admin app.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setOpenSignIn(true)}
                  className="group flex items-center gap-3 bg-forest-700 hover:bg-forest-800 text-white font-body font-medium px-7 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-green-900/25 active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  Super Admin sign in
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href={ADMIN}
                  className="flex items-center gap-2 bg-white hover:bg-green-50 text-forest-800 font-body font-medium px-7 py-4 rounded-2xl border border-green-200 transition-all hover:border-green-400 hover:shadow-md active:scale-95"
                >
                  <Shield className="w-4 h-4 text-green-600" />
                  Store admin app
                </a>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  <span>Users &amp; roles</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-green-600" />
                  <span>Analytics &amp; logs</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 to-emerald-100 opacity-60" />
                <div className="absolute inset-4 rounded-full bg-white/50 backdrop-blur-sm border border-green-200/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-9xl sm:text-[10rem] animate-float select-none drop-shadow-2xl">
                    🛡️
                  </span>
                </div>
                {[
                  { emoji: "🔐", top: "-12%", left: "50%", delay: "0s" },
                  { emoji: "📊", top: "22%", right: "-12%", delay: "1.2s" },
                  { emoji: "⚙️", bottom: "-6%", left: "52%", delay: "0.7s" },
                ].map(({ emoji, top, left, right, bottom, delay }, i) => (
                  <div
                    key={i}
                    className="absolute w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-2xl border border-green-100 animate-float"
                    style={{ top, left, right, bottom, animationDelay: delay }}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-green-200/80 bg-white/60 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p className="text-center sm:text-left">
            Managing a single store? Use the{" "}
            <a href={ADMIN} className="text-forest-700 font-medium hover:underline">
              Admin portal
            </a>{" "}
            instead.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={STORE} className="hover:text-forest-800">
              Store
            </a>
            <span className="text-gray-300">·</span>
            <button onClick={() => setOpenSignIn(true)} className="hover:text-forest-800">
              Super Admin login
            </button>
          </div>
        </div>
      </footer>

      {openSignIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close"
            className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-green-100 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-green-100 bg-[#FEFAE0]/90 px-5 py-4">
              <div className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-700 to-green-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest-900">Super Admin Sign In</p>
                  <p className="text-[11px] text-gray-600">Use your superadmin credentials</p>
                </div>
              </div>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-forest-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pt-4 pb-5">
              {authError && (
                <div className="mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {authError}
                </div>
              )}
              <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wide text-gray-500">Email</label>
              <input
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                className="mb-3 w-full rounded-xl border border-green-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-green-600/30 focus:border-green-500"
              />
              <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wide text-gray-500">Password</label>
              <div className="relative mb-4">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-green-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-green-600/30 focus:border-green-500"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                disabled={authLoading}
                onClick={handleSignIn}
                className="w-full rounded-xl bg-forest-700 hover:bg-forest-800 py-2.5 text-sm font-semibold text-white disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
