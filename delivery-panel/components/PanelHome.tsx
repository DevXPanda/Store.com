"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Leaf,
  ArrowRight,
  Truck,
  Navigation,
  MapPin,
  Clock,
} from "lucide-react";
import { DeliverySignInModal } from "@/components/DeliverySignInModal";
import { PartnerApplyModal } from "@/components/PartnerApplyModal";

const STORE = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";

function PanelHomeInner() {
  const searchParams = useSearchParams();
  const [signInOpen, setSignInOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("signin") === "1") {
      setSignInOpen(true);
    }
    if (searchParams.get("apply") === "1") {
      setApplyOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-[#1a1a1a]">
      <DeliverySignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <PartnerApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} />

      <div className="bg-forest-800 py-1.5 text-center font-body text-xs tracking-wide text-green-100">
        <span className="inline-flex items-center justify-center gap-2 px-4">
          <MapPin className="h-3 w-3 shrink-0" />
          Delivery partners · Routes · proof of delivery
        </span>
      </div>

      <header className="sticky top-0 z-40 border-b border-green-100/80 bg-[#FEFAE0]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="group flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 shadow-md transition-transform duration-300 group-hover:rotate-12">
                <Leaf className="h-5 w-5 text-green-200" />
              </div>
              <div>
                <span className="font-display text-xl font-bold tracking-tight text-forest-800">
                  Veg<span className="text-green-600">Fru</span>
                </span>
                <span className="-mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-green-600">
                  Delivery
                </span>
              </div>
            </a>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-forest-700 sm:inline-flex"
              >
                View storefront
              </a>
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 font-body text-sm font-medium text-white transition-all hover:bg-forest-800 hover:shadow-lg active:scale-[0.98]"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[calc(100vh-7rem)] items-center overflow-hidden pb-16 pt-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob-1 absolute -left-32 -top-32 h-96 w-96 bg-green-200/40" />
          <div className="blob-2 absolute -bottom-20 -right-32 h-80 w-80 bg-amber-200/40" />
          <div className="blob-1 absolute right-1/4 top-1/3 h-64 w-64 bg-lime-100/60" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, #166534 0, #166534 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #166534 0, #166534 1px, transparent 0, transparent 50%)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-100 px-4 py-2 font-mono text-xs uppercase tracking-wider text-forest-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                On the road for VegFru
              </div>

              <div className="space-y-2">
                <h1 className="font-display text-5xl font-bold leading-[1.05] text-forest-900 sm:text-6xl lg:text-7xl">
                  Deliver fresh,
                  <span className="block italic text-forest-600">route by route,</span>
                  <span className="block text-green-600">with clarity.</span>
                </h1>
              </div>

              <p className="max-w-md font-body text-lg leading-relaxed text-gray-600">
                See assigned drops, update status, and complete handoffs — tuned for VegFru delivery partners. Sign in with your
                registered mobile (OTP).
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => setSignInOpen(true)}
                  className="group flex items-center gap-3 rounded-2xl bg-forest-700 px-7 py-4 font-body font-medium text-white transition-all hover:bg-forest-800 hover:shadow-xl hover:shadow-green-900/25 active:scale-95"
                >
                  <Truck className="h-4 w-4" />
                  Partner sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={STORE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-2xl border border-green-200 bg-white px-7 py-4 font-body font-medium text-forest-800 transition-all hover:border-green-400 hover:bg-green-50 hover:shadow-md active:scale-95"
                >
                  <Navigation className="h-4 w-4 text-green-600" />
                  Customer site
                </a>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span>Live stops &amp; maps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>Status updates</span>
                </div>
              </div>

              <div className="rounded-2xl border border-green-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:bg-white/90">
                <p className="text-sm font-medium text-forest-900">New to VegFru delivery?</p>
                <p className="mt-1 text-sm text-gray-600">
                  Fill a short application. After superadmin approval, you&apos;ll use the same mobile number with OTP to open your dashboard.
                </p>
                <button
                  type="button"
                  onClick={() => setApplyOpen(true)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 underline decoration-forest-700/30 underline-offset-2 transition hover:decoration-forest-700"
                >
                  Apply to become a partner
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative h-80 w-80 sm:h-96 sm:w-96">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 to-emerald-100 opacity-60" />
                <div className="absolute inset-4 rounded-full border border-green-200/50 bg-white/50 backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="animate-float select-none text-9xl drop-shadow-2xl sm:text-[10rem]">🛵</span>
                </div>
                {[
                  { emoji: "📍", top: "-10%", left: "48%", delay: "0s" },
                  { emoji: "📦", top: "24%", right: "-10%", delay: "1s" },
                  { emoji: "✓", bottom: "-4%", left: "58%", delay: "0.6s" },
                ].map(({ emoji, top, left, right, bottom, delay }, i) => (
                  <div
                    key={i}
                    className="animate-float absolute flex h-14 w-14 items-center justify-center rounded-2xl border border-green-100 bg-white text-2xl shadow-lg"
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

      <footer className="border-t border-green-200/80 bg-white/60 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-600 sm:flex-row sm:px-6 lg:px-8">
          <p>VegFru delivery partner app — not for customers.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={STORE} className="hover:text-forest-800">
              Store
            </a>
            <span className="text-gray-300">·</span>
            <button type="button" onClick={() => setApplyOpen(true)} className="hover:text-forest-800">
              Apply
            </button>
            <span className="text-gray-300">·</span>
            <button type="button" onClick={() => setSignInOpen(true)} className="hover:text-forest-800">
              Sign in
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PanelHome() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FEFAE0] font-body text-forest-800">
          Loading…
        </div>
      }
    >
      <PanelHomeInner />
    </Suspense>
  );
}
