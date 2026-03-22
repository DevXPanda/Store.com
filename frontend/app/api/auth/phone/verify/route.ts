import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { checkOtpSms } from "@/lib/twilioVerify";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

function getJWTSecret() {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(s || "vegfru-dev-secret-key-2026");
}

function toE164India(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return null;
  return `+91${d}`;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    const e164 = toE164India(String(phone ?? ""));
    if (!e164 || !otp) {
      return NextResponse.json({ success: false, error: "Phone and code required" }, { status: 400 });
    }

    const check = await checkOtpSms(e164, String(otp).trim());
    if (check.status !== "approved") {
      return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 401 });
    }

    if (!CONVEX_URL) {
      return NextResponse.json({ success: false, error: "Server misconfigured." }, { status: 500 });
    }

    const digits10 = e164.replace(/\D/g, "").slice(-10);
    const q = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "auth:getCustomerByPhone",
        args: { phone: digits10 },
      }),
    });
    const qj = await q.json();
    const user = qj?.value as { _id: string; name: string; email: string; role: string } | null;
    if (!user) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "auth:updateLastLogin", args: { id: user._id } }),
      });
    } catch {
      /* ignore */
    }

    const JWT_SECRET = getJWTSecret();
    const token = await new SignJWT({
      userId: user._id,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
