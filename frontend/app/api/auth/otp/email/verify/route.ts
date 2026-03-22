import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

function getJWTSecret() {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
  return new TextEncoder().encode(s || "vegfru-dev-secret-key-2026");
}

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp || String(otp).trim().length < 4) {
      return NextResponse.json({ success: false, error: "Email and code required" }, { status: 400 });
    }

    if (!CONVEX_URL) {
      return NextResponse.json({ success: false, error: "Server misconfigured (Convex URL missing)." }, { status: 500 });
    }

    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "customerRegistration:verifyRegistrationOtp",
        args: { email: String(email).toLowerCase().trim(), otp: String(otp).trim() },
      }),
    });
    const data = await res.json();
    if (data.status === "error" || data.errorMessage) {
      return NextResponse.json(
        { success: false, error: data.errorMessage || "Verification failed" },
        { status: 400 }
      );
    }
    const userId = data.value as string | undefined;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Verification failed" }, { status: 400 });
    }

    try {
      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "auth:updateLastLogin", args: { id: userId } }),
      });
    } catch {
      /* ignore */
    }

    const userRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "auth:getUserById",
        args: { id: userId },
      }),
    });
    const uj = await userRes.json();
    const user = uj?.value as { name?: string; email?: string; role?: string } | null;

    const JWT_SECRET = getJWTSecret();
    const token = await new SignJWT({
      userId,
      role: "customer",
      name: user?.name || "",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        name: user?.name || "",
        email: user?.email || String(email).toLowerCase().trim(),
        role: "customer",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
