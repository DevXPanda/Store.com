import { NextRequest, NextResponse } from "next/server";
import { normalizeE164 } from "@/lib/phone";
import { sendOtpSms } from "@/lib/twilioVerify";

export async function POST(req: NextRequest) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    const e164 = normalizeE164(phone || "");
    if (!e164) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }
    await sendOtpSms(e164);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not send OTP";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
