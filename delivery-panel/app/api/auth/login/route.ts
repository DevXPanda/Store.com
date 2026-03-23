import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "vegfru-dev-secret");

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email ?? "").toLowerCase().trim();
    const normalizedPassword = String(password ?? "");
    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }
    if (!CONVEX_URL) {
      return NextResponse.json({ success: false, error: "NEXT_PUBLIC_CONVEX_URL is missing" }, { status: 500 });
    }

    const q = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "auth:getUserByEmail", args: { email: normalizedEmail } }),
    });
    if (!q.ok) {
      return NextResponse.json({ success: false, error: "Failed to query account" }, { status: 500 });
    }
    const user = (await q.json()).value;
    if (!user || user.role !== "delivery" || !user.isActive) {
      return NextResponse.json({ success: false, error: "Invalid delivery credentials" }, { status: 401 });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(normalizedPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid delivery credentials" }, { status: 401 });
    }

    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "auth:updateLastLogin", args: { id: user._id } }),
    }).catch(() => {});

    const token = await new SignJWT({ userId: user._id, role: user.role, name: user.name })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone || "" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
