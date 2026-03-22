"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";

type Status = "loading" | "pending" | "approved" | "rejected" | "none" | "unauthorized";

export default function AdminPendingPage() {
  const router = useRouter();
  const [state, setState] = useState<{
    kind: Status;
    phone?: string;
    submittedAt?: number;
    message?: string;
  }>({ kind: "loading" });

  const load = async () => {
    try {
      const res = await fetch("/api/admin/pending/status", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState({ kind: "unauthorized" });
        return;
      }
      setState({
        kind: data.status as Status,
        phone: data.phone,
        submittedAt: data.submittedAt,
      });
    } catch {
      setState({ kind: "unauthorized" });
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (state.kind === "approved") {
      const t = setTimeout(() => router.replace("/?signin=1"), 4000);
      return () => clearTimeout(t);
    }
  }, [state.kind, router]);

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900">
      <header className="sticky top-0 z-40 bg-[#FEFAE0]/95 backdrop-blur-md border-b border-green-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
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
          </Link>
          <Link
            href="/"
            className="text-sm text-forest-700 hover:underline font-medium"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {state.kind === "loading" && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="w-10 h-10 text-forest-700 animate-spin" />
            <p className="text-gray-600 text-sm">Checking application status…</p>
          </div>
        )}

        {state.kind === "unauthorized" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-8 text-center">
            <p className="text-forest-900 font-medium mb-2">
              Sign in with phone to view your application status.
            </p>
            <Link
              href="/?signin=1"
              className="inline-flex text-forest-700 font-semibold underline"
            >
              Go to admin sign-in
            </Link>
          </div>
        )}

        {state.kind === "pending" && (
          <div className="rounded-2xl border border-green-200 bg-white/90 shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest-700/10 text-forest-800 mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-forest-900 mb-2">
              Application under review
            </h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Thanks for submitting your partner application
              {state.phone ? (
                <span className="font-mono text-forest-800"> {state.phone}</span>
              ) : null}
              . A super admin will verify your details. You’ll be able to open
              the admin dashboard only after approval.
            </p>
            {state.submittedAt != null && (
              <p className="text-xs text-gray-500 mb-6">
                Submitted{" "}
                {new Date(state.submittedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
            <p className="text-xs text-gray-500 mb-6">
              This page refreshes every 30 seconds. After approval, sign in again
              with your phone (OTP) to access the dashboard.
            </p>
            <Link
              href="/?signin=1"
              className="inline-flex items-center justify-center rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium px-6 py-3 text-sm"
            >
              Back to sign-in
            </Link>
          </div>
        )}

        {state.kind === "approved" && (
          <div className="rounded-2xl border border-green-200 bg-white/90 shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 text-green-800 mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-forest-900 mb-2">
              You’re approved
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Your partner application was accepted. Sign in with phone (OTP) to
              open the admin dashboard.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Redirecting to sign-in…
            </p>
            <Link
              href="/?signin=1"
              className="inline-flex items-center justify-center rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium px-6 py-3 text-sm"
            >
              Sign in now
            </Link>
          </div>
        )}

        {state.kind === "rejected" && (
          <div className="rounded-2xl border border-red-100 bg-white/90 shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-700 mb-4">
              <XCircle className="w-7 h-7" />
            </div>
            <h1 className="font-display text-2xl font-bold text-forest-900 mb-2">
              Application not approved
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              You can sign in with phone again to submit a new application if
              allowed.
            </p>
            <Link
              href="/?signin=1"
              className="inline-flex items-center justify-center rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium px-6 py-3 text-sm"
            >
              Back to sign-in
            </Link>
          </div>
        )}

        {state.kind === "none" && (
          <div className="rounded-2xl border border-green-200 bg-white/90 shadow-sm p-8 text-center">
            <p className="text-gray-700 mb-6">
              No application found for this session. Complete partner onboarding
              after phone verification.
            </p>
            <Link
              href="/?signin=1"
              className="inline-flex items-center justify-center rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium px-6 py-3 text-sm"
            >
              Go to sign-in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
