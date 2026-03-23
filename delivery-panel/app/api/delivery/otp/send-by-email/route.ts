import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import nodemailer from "nodemailer";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  try {
    const { email, channel } = await req.json();
    const normalized = String(email ?? "").trim().toLowerCase();
    const otpChannel: "phone" | "email" = channel === "email" ? "email" : "phone";
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (!CONVEX_URL) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const res = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path:
          otpChannel === "email"
            ? "deliveryPartnerAuth:requestDeliveryEmailOtpByEmail"
            : "deliveryPartnerAuth:requestDeliveryOtpByEmail",
        args: { email: normalized },
      }),
    });
    const data = (await res.json()) as {
      status?: string;
      errorMessage?: string;
      value?: { devCode?: string; ok?: boolean; phone?: string; email?: string };
    };
    if (data.status === "error" || data.errorMessage || !data.value) {
      return NextResponse.json(
        { error: data.errorMessage || "Could not send OTP" },
        { status: 400 }
      );
    }

    const digits = data.value.phone;
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const code = data.value.devCode;
    const hasVerify = Boolean(sid && token && verifyServiceSid && digits);
    const hasMessaging = Boolean(sid && token && from && code && digits);
    const smsSent = hasVerify || hasMessaging;

    if (otpChannel === "phone") {
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
        channel: "phone",
        phone: digits,
        devCode: smsSent ? undefined : code,
      });
    }

    const sentTo = data.value.email || normalized;
    if (smtpConfigured()) {
      const host = process.env.SMTP_HOST!.trim();
      const port = Number(process.env.SMTP_PORT || 587);
      const secure = process.env.SMTP_SECURE === "true" || port === 465;
      const fromEmail =
        process.env.FROM_EMAIL?.trim() ||
        process.env.SMTP_FROM?.trim() ||
        process.env.SMTP_USER!.trim();
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER!.trim(),
          pass: process.env.SMTP_PASS!.trim(),
        },
      });
      await transporter.sendMail({
        from: fromEmail,
        to: sentTo,
        subject: "VegFru delivery login OTP",
        html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
    <div style="font-size:22px;font-weight:700;color:#14532d;margin-bottom:8px;">🌿 VegFru</div>
    <p style="color:#334155;font-size:15px;line-height:1.5;">Hi Delivery Partner,</p>
    <p style="color:#334155;font-size:15px;">Use this code to sign in to your delivery dashboard:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#14532d;background:#f0fdf4;padding:14px 28px;border-radius:12px;border:1px solid #bbf7d0;">${escapeHtml(
        String(code || "")
      )}</span>
    </div>
    <p style="color:#64748b;font-size:13px;">This code expires in 5 minutes. If you didn&apos;t request it, you can ignore this email.</p>
  </div></body></html>`,
      });
    }
    return NextResponse.json({
      ok: true,
      channel: "email",
      email: sentTo,
      devCode: smtpConfigured() ? undefined : code,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to send OTP";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
