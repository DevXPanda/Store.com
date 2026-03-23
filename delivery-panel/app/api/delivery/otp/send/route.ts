import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const digits = String(phone ?? "")
      .replace(/\D/g, "")
      .slice(-10);
    if (digits.length !== 10) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
    }

    if (!CONVEX_URL) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "deliveryPartnerAuth:requestDeliveryOtp",
        args: { phone: digits },
      }),
    });
    const data = (await res.json()) as {
      status?: string;
      errorMessage?: string;
      value?: { devCode?: string; ok?: boolean };
    };
    if (data.status === "error" || data.errorMessage) {
      return NextResponse.json(
        { error: data.errorMessage || "Could not send OTP" },
        { status: 400 }
      );
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const code = data.value?.devCode;
    const hasVerify = Boolean(sid && token && verifyServiceSid);
    const hasMessaging = Boolean(sid && token && from && code);
    const smsSent = hasVerify || hasMessaging;

    if (smsSent) {
      const client = twilio(sid!, token!);
      if (hasVerify) {
        await client.verify.v2
          .services(verifyServiceSid!)
          .verifications.create({ to: `+91${digits}`, channel: "sms" });
      } else {
        await client.messages.create({
          to: `+91${digits}`,
          from: from!,
          body: `Your VegFru delivery partner code: ${code}. Valid for 5 minutes.`,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      devCode: smsSent ? undefined : code,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to send OTP";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
