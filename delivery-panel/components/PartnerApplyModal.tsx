"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, Leaf } from "lucide-react";
import { convexMutation } from "@/lib/convex";

const CITIES = [
  "Faridabad",
  "Gurugram",
  "Delhi",
  "Noida",
  "Ghaziabad",
  "Greater Noida",
  "Other (NCR)",
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PartnerApplyModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setPhone("");
      setCity("");
      setError("");
      setDone(false);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await convexMutation("deliveryPartnerAuth:submitDeliveryPartnerApplication", {
        name: name.trim(),
        phone,
        city,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  function handleClose() {
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-green-200/90 bg-[#FEFAE0] text-[#1a1a1a] shadow-2xl [color-scheme:light]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-apply-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-forest-800/60 transition hover:bg-white/80 hover:text-forest-900"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="border-b border-green-200/80 bg-white/60 px-6 pb-5 pt-6">
          <div className="mb-3 inline-flex items-center gap-2 text-forest-800">
            <Leaf className="h-5 w-5 text-green-600" />
            <span className="font-display text-base font-bold">
              Veg<span className="text-green-600">Fru</span> Delivery
            </span>
          </div>
          <h2 id="partner-apply-title" className="font-display text-2xl font-bold text-forest-900">
            Become a delivery partner
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#334155]">
            Short form — our team verifies your details. You&apos;ll sign in later with OTP on your registered number.
          </p>
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="rounded-xl border border-green-200 bg-white p-6 text-center text-[#1a1a1a] shadow-inner">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-forest-600" />
              <p className="font-display text-lg font-semibold text-forest-900">Application received</p>
              <p className="mt-2 text-sm text-[#475569]">
                Superadmin will review your request. Once approved, sign in here with your mobile — we&apos;ll send an OTP.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-5 w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white transition hover:bg-forest-800"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
                  Full name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-[#0f172a] shadow-sm outline-none placeholder:text-slate-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-500/25"
                  placeholder="Your name"
                  style={{ color: "#0f172a" }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
                  Mobile number *
                </label>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-mono text-sm text-[#0f172a] shadow-sm outline-none placeholder:text-slate-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-500/25"
                  placeholder="10-digit number"
                  style={{ color: "#0f172a" }}
                />
                <p className="mt-1 text-xs text-[#475569]">
                  {10 - phone.length > 0 ? `${10 - phone.length} digit(s) remaining` : "Ready"}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
                  City *
                </label>
                <select
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-[#0f172a] shadow-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/25"
                  style={{ color: "#0f172a" }}
                >
                  <option value="" className="bg-white text-[#0f172a]">
                    Select your city
                  </option>
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="bg-white text-[#0f172a]">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : null}
                Join to deliver
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
