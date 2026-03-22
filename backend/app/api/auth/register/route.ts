import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import bcrypt from "bcryptjs";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields required" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await convex.mutation(api.auth.createUser, {
      name, email, passwordHash, role: "customer", phone,
    });
    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Registration failed" }, { status: 400 });
  }
}
