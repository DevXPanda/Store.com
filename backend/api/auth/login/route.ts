import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vegfru-super-secret-key-2026"
);

// Demo users for when Convex is not yet seeded
const DEMO_USERS = [
  { id: "demo-admin", email: "admin@vegfru.com", password: "admin123", name: "Admin User", role: "admin" as const },
  { id: "demo-delivery", email: "delivery@vegfru.com", password: "delivery123", name: "Ravi Kumar", role: "delivery" as const },
  { id: "demo-customer", email: "customer@vegfru.com", password: "customer123", name: "Priya Sharma", role: "customer" as const },
];

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    // Check demo users first
    const demoUser = DEMO_USERS.find((u) => u.email === email);
    if (demoUser && demoUser.password === password) {
      const token = await new SignJWT({ userId: demoUser.id, role: demoUser.role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(JWT_SECRET);
      return NextResponse.json({
        success: true,
        token,
        user: { id: demoUser.id, name: demoUser.name, email: demoUser.email, role: demoUser.role },
      });
    }

    // Try Convex
    try {
      const user = await convex.query(api.auth.getUserByEmail, { email });
      if (!user) {
        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
      }
      const token = await new SignJWT({ userId: user._id, role: user.role })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(JWT_SECRET);
      return NextResponse.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
