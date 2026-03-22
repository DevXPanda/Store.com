import { NextRequest, NextResponse } from "next/server";
import { sendOtpSms, isTwilioVerifyConfigured } from "@/lib/twilioVerify";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

function toE164India(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length !== 10) return null;
  return `+91${d}`;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const e164 = toE164India(String(phone ?? ""));
    if (!e164) {
      return NextResponse.json({ success: false, error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }

    if (!isTwilioVerifyConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "SMS sign-in is not configured. Use email and password, or set Twilio Verify env vars.",
        },
        { status: 503 }
      );
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
    const user = qj?.value;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found for this number. Sign up with email first." },
        { status: 404 }
      );
    }

    await sendOtpSms(e164);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Could not send SMS";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
