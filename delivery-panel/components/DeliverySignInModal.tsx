"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ArrowRight, Smartphone } from "lucide-react";
import { convexMutation } from "@/lib/convex";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DeliverySignInModal({ open, onClose }: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhone("");
      setOtp("");
      setStep("phone");
      setError("");
      setDevCode(null);
    }
  }, [open]);

  if (!open) return null;

  async function sendOtp() {
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = (await convexMutation("deliveryPartnerAuth:requestDeliveryOtp", {
        phone: digits,
      })) as { devCode?: string };
      setDevCode(res?.devCode ?? null);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send OTP");
    }
    setLoading(false);
  }

  async function verify() {
    const digits = phone.replace(/\D/g, "").slice(-10);
    const code = otp.trim();
    if (code.length < 4) {
      setError("Enter the OTP");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = (await convexMutation("deliveryPartnerAuth:verifyDeliveryOtp", {
        phone: digits,
        code,
      })) as { user: { id: string; name: string; email: string; phone: string; rating: number } };
      const u = res.user;
      localStorage.setItem(
        "vegfru_delivery_user",
        JSON.stringify({
          name: u.name,
          email: u.email,
          phone: u.phone,
          id: u.id,
          rating: u.rating,
        })
      );
      onClose();
      router.push("/delivery");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-green-200 bg-white p-6 text-[#1a1a1a] shadow-2xl [color-scheme:light]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-signin-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-700 text-white shadow-md">
            <Smartphone size={20} />
          </div>
          <div>
            <h2 id="delivery-signin-title" className="text-lg font-bold text-[#0f172a]">
              Partner sign in
            </h2>
            <p className="text-xs text-[#64748b]">Use the mobile number registered with VegFru</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
                Mobile number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-500/25"
                style={{ color: "#0f172a" }}
              />
            </div>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-70 dark:from-forest-600 dark:to-forest-800"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : <ArrowRight className="h-4 w-4" />}
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#475569]">
              Enter the code sent to{" "}
              <span className="font-mono font-semibold text-[#0f172a]">+91 {phone.replace(/\D/g, "").slice(-10)}</span>
            </p>
            {devCode && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-sm text-amber-900">
                Dev: OTP is <strong>{devCode}</strong> (remove when SMS is live)
              </p>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#0f172a]">
                One-time password
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6 digits"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 font-mono text-lg tracking-[0.3em] text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-forest-600 focus:ring-2 focus:ring-forest-500/25"
                style={{ color: "#0f172a" }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={verify}
                disabled={loading}
                className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-70 dark:from-forest-600 dark:to-forest-800"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : null}
                Verify &amp; continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
