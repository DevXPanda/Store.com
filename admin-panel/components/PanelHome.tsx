"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  ArrowRight,
  Truck,
  Package,
  ShoppingBag,
  MapPin,
  Shield,
} from "lucide-react";
import { SignInModal } from "@/components/SignInModal";

const STORE = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";
const SUPERADMIN = process.env.NEXT_PUBLIC_SUPERADMIN_URL || "http://localhost:3003";

export default function PanelHome() {
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900">
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <div className="bg-forest-800 text-green-100 text-xs py-1.5 text-center font-body tracking-wide">
        <span className="inline-flex items-center justify-center gap-2 px-4">
          <MapPin className="w-3 h-3 shrink-0" />
          Store operations · Orders · inventory · customers
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
                  Admin Portal
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
                type="button"
                onClick={() => setSignInOpen(true)}
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
                Day-to-day store control
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-forest-900">
                  Run your store,
                  <span className="block italic text-forest-600">calmly,</span>
                  <span className="block text-green-600">from one place.</span>
                </h1>
              </div>

              <p className="font-body text-gray-600 text-lg leading-relaxed max-w-md">
                Approve orders, update catalog, and coordinate delivery — built for VegFru ops
                teams. Sign in with an admin account to continue.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setSignInOpen(true)}
                  className="group flex items-center gap-3 bg-forest-700 hover:bg-forest-800 text-white font-body font-medium px-7 py-4 rounded-2xl transition-all hover:shadow-xl hover:shadow-green-900/25 active:scale-95"
                >
                  <Shield className="w-4 h-4" />
                  Sign in to Admin
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href={STORE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white hover:bg-green-50 text-forest-800 font-body font-medium px-7 py-4 rounded-2xl border border-green-200 transition-all hover:border-green-400 hover:shadow-md active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4 text-green-600" />
                  Open storefront
                </a>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <span>Products &amp; pricing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span>Orders &amp; fulfilment</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 to-emerald-100 opacity-60" />
                <div className="absolute inset-4 rounded-full bg-white/50 backdrop-blur-sm border border-green-200/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-9xl sm:text-[10rem] animate-float select-none drop-shadow-2xl">
                    📋
                  </span>
                </div>
                {[
                  { emoji: "📦", top: "-12%", left: "50%", delay: "0s" },
                  { emoji: "🛒", top: "20%", right: "-12%", delay: "1.5s" },
                  { emoji: "✅", bottom: "-8%", left: "55%", delay: "0.8s" },
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
          <p>
            Platform-wide access?{" "}
            <a
              href={SUPERADMIN}
              className="text-forest-700 font-medium hover:underline"
            >
              Super Admin console
            </a>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={STORE} className="hover:text-forest-800">
              Store
            </a>
            <span className="text-gray-300">·</span>
            <Link href="/admin/login" className="hover:text-forest-800">
              Admin login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
