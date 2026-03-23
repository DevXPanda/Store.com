import { NextRequest, NextResponse } from "next/server";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    const normalized = String(email ?? "").trim().toLowerCase();
    const otp = String(code ?? "").trim();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (otp.length < 4) {
      return NextResponse.json({ error: "Enter the OTP" }, { status: 400 });
    }
    if (!CONVEX_URL) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "deliveryPartnerAuth:verifyDeliveryEmailOtp",
        args: { email: normalized, code: otp },
      }),
    });
    const data = await res.json();
    if (data.status === "error" || data.errorMessage || !data.value?.user) {
      return NextResponse.json(
        { error: data.errorMessage || "Invalid or expired OTP. Request a new code." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, user: data.value.user });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
