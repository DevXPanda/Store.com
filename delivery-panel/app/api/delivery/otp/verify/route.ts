import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
    const otp = String(code ?? "").trim();
    if (digits.length !== 10) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }
    if (otp.length < 4) {
      return NextResponse.json({ error: "Enter the OTP" }, { status: 400 });
    }
    if (!CONVEX_URL) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const hasVerify = Boolean(sid && token && verifyServiceSid);

    if (hasVerify) {
      const client = twilio(sid!, token!);
      const check = await client.verify.v2
        .services(verifyServiceSid!)
        .verificationChecks.create({ to: `+91${digits}`, code: otp });
      if (check.status !== "approved") {
        return NextResponse.json({ error: "Invalid or expired OTP. Request a new code." }, { status: 400 });
      }
      const loginRes = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "deliveryPartnerAuth:loginDeliveryByPhone",
          args: { phone: digits },
        }),
      });
      const loginData = await loginRes.json();
      if (loginData.status === "error" || loginData.errorMessage || !loginData.value?.user) {
        return NextResponse.json(
          { error: loginData.errorMessage || "Invalid login" },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, user: loginData.value.user });
    }

    const fallbackRes = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "deliveryPartnerAuth:verifyDeliveryOtp",
        args: { phone: digits, code: otp },
      }),
    });
    const fallbackData = await fallbackRes.json();
    if (fallbackData.status === "error" || fallbackData.errorMessage || !fallbackData.value?.user) {
      return NextResponse.json(
        { error: fallbackData.errorMessage || "Invalid or expired OTP. Request a new code." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, user: fallbackData.value.user });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
