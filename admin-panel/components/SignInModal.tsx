"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, X, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { normalizeE164 } from "@/lib/phone";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When opening from /?signin=1, start on email/password */
  initialAuthTab?: "phone" | "email";
};

export function SignInModal({ open, onClose, initialAuthTab = "phone" }: Props) {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<"phone" | "email">(initialAuthTab);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailOtpRequired, setEmailOtpRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAuthTab(initialAuthTab);
    setStep("phone");
    setPhone("");
    setOtp("");
    setError("");
    setEmail("");
    setPassword("");
    setShowPw(false);
    setEmailOtpRequired(false);
  }, [open, initialAuthTab]);

  if (!open) return null;

  const handleClose = () => {
    onClose();
  };

  const sendSms = async () => {
    setError("");
    const e164 = normalizeE164(phone);
    if (!e164) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: e164 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send SMS");
        setLoading(false);
        return;
      }
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign-in failed");
        setLoading(false);
        return;
      }
      if (data.next === "admin") {
        if (data.user) {
          try {
            localStorage.setItem("vegfru_admin", JSON.stringify(data.user));
          } catch {
            /* ignore */
          }
        }
        handleClose();
        router.push("/admin");
        router.refresh();
        return;
      }
      if (data.next === "onboarding") {
        handleClose();
        router.push("/admin/onboarding");
        return;
      }
      if (data.next === "pending") {
        handleClose();
        router.push("/admin/pending");
        return;
      }
      setError("Unexpected response");
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const emailLogin = async () => {
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.otpRequired) {
          setEmailOtpRequired(true);
          if (data.devCode) {
            console.log("Admin Email OTP (Dev):", data.devCode);
          }
        } else if (data.user && data.user.role === "admin") {
          completeLogin(data);
        } else {
          setError("Access denied. Admin account required.");
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const verifyEmailOtp = async () => {
    if (!otp || otp.length < 6) {
      setError("Enter 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        completeLogin(data);
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  };

  const completeLogin = (data: any) => {
    document.cookie = `vegfru_token=${data.token};path=/;max-age=${7 * 86400};samesite=strict`;
    document.cookie = `vegfru_user=${JSON.stringify(data.user)};path=/;max-age=${7 * 86400};samesite=strict`;
    localStorage.setItem("vegfru_admin", JSON.stringify(data.user));
    handleClose();
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={handleClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-green-100 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-green-100 bg-[#FEFAE0]/90">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 border border-green-200 px-3 py-1 text-[11px] font-mono uppercase tracking-wide text-forest-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Admin sign-in
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-4">
          <button
            type="button"
            onClick={() => { setAuthTab("phone"); setError(""); }}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
              authTab === "phone"
                ? "bg-forest-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Phone (SMS)
          </button>
          <button
            type="button"
            onClick={() => { setAuthTab("email"); setError(""); }}
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
              authTab === "email"
                ? "bg-forest-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Email
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-forest-700 rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-6 h-6 text-green-200" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold text-forest-900">
            VegFru Admin
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {authTab === "phone"
              ? "Sign in with phone (OTP via SMS)"
              : "Sign in with admin email and password"}
          </p>
        </div>

        <div className="px-6 pb-6 pt-2">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}

          {authTab === "email" && !emailOtpRequired && (
            <>
              <label className="block text-left text-[11px] font-mono uppercase tracking-wide text-gray-500 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@vegfru.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500 mb-3"
              />
              <label className="block text-left text-[11px] font-mono uppercase tracking-wide text-gray-500 mb-1.5">
                Password
              </label>
              <div className="relative mb-4">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && emailLogin()}
                  className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 pr-12 text-gray-900 outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={emailLogin}
                className="w-full rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3.5 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </>
          )}

          {authTab === "email" && emailOtpRequired && (
            <>
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-600">
                  Verification code sent to <span className="font-semibold text-forest-800">{email}</span>
                </p>
              </div>
              <label className="block text-left text-[11px] font-mono uppercase tracking-wide text-gray-500 mb-1.5">
                Enter Email OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-forest-900 outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500"
              />
              <button
                type="button"
                disabled={loading || otp.length !== 6}
                onClick={verifyEmailOtp}
                className="mt-4 w-full rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3.5 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify &amp; Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailOtpRequired(false);
                  setOtp("");
                  setError("");
                }}
                className="mt-3 w-full text-sm text-forest-700 hover:underline text-center"
              >
                Change email
              </button>
            </>
          )}

          {authTab === "phone" && step === "phone" && (
            <>
              <label className="block text-left text-[11px] font-mono uppercase tracking-wide text-gray-500 mb-1.5">
                Phone number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500"
              />
              <button
                type="button"
                disabled={loading || phone.replace(/\D/g, "").length < 10}
                onClick={sendSms}
                className="mt-4 w-full rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3.5 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send SMS code
              </button>
            </>
          )}

          {authTab === "phone" && step === "otp" && (
            <>
              <label className="block text-left text-[11px] font-mono uppercase tracking-wide text-gray-500 mb-1.5">
                Enter SMS code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-forest-900 outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-500"
              />
              <button
                type="button"
                disabled={loading || otp.length !== 6}
                onClick={verifyOtp}
                className="mt-4 w-full rounded-xl bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3.5 transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify &amp; continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                className="mt-3 w-full text-sm text-forest-700 hover:underline"
              >
                Change number
              </button>
            </>
          )}

          {authTab === "phone" && (
            <p className="mt-5 text-[11px] text-center text-gray-500 leading-relaxed">
              OTP is sent through Twilio Verify.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
