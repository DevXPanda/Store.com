import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isSmtpConfigured, sendOtpEmail } from "@/lib/mail";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

function validate(body: {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
}): string | null {
  if (!body.name || body.name.trim().length < 2) return "Name must be at least 2 characters";
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return "Valid email required";
  if (!body.password || body.password.length < 6) return "Password must be at least 6 characters";
  if (body.phone && body.phone.replace(/\D/g, "").length > 0 && body.phone.replace(/\D/g, "").length < 10) {
    return "Enter a valid 10-digit phone or leave empty";
  }
  return null;
}

function randomOtp6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const err = validate(body);
    if (err) return NextResponse.json({ success: false, error: err }, { status: 400 });

    if (!CONVEX_URL) {
      return NextResponse.json(
        { success: false, error: "Server misconfigured (Convex URL missing)." },
        { status: 500 }
      );
    }

    const name = body.name.trim();
    const email = body.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(body.password.trim(), 10);
    const phoneDigits = body.phone ? body.phone.replace(/\D/g, "").slice(-10) : undefined;
    const phone = phoneDigits && phoneDigits.length === 10 ? phoneDigits : undefined;

    const otp = randomOtp6();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const mut = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "customerRegistration:upsertRegistrationOtp",
        args: { email, codeHash, expiresAt, name, passwordHash, phone },
      }),
    });
    const data = await mut.json();
    if (data.status === "error" || data.errorMessage) {
      return NextResponse.json(
        { success: false, error: data.errorMessage || "Could not start verification" },
        { status: 400 }
      );
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json({
        success: true,
        dev: true,
        message: "Add SMTP_HOST, SMTP_USER, and SMTP_PASS to send real emails.",
        devOtp: otp,
      });
    }

    const sent = await sendOtpEmail({ to: email, code: otp, name: name.split(" ")[0] });
    if (!sent.ok) {
      return NextResponse.json(
        { success: false, error: "error" in sent ? sent.error : "Could not send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
