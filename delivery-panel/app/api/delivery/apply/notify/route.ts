import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, city } = await req.json();
    const to = String(email ?? "").trim().toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }
    if (!isConfigured()) return NextResponse.json({ ok: true, dev: true });

    const host = process.env.SMTP_HOST!.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const from =
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
      from,
      to,
      subject: "VegFru delivery partner application received",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2 style="margin:0 0 12px">Application received</h2>
          <p>Hi ${String(name || "Partner")},</p>
          <p>Your VegFru delivery partner application has been received${city ? ` for ${city}` : ""}.</p>
          <p>Once approved, you can sign in on the delivery panel using either mobile OTP or your registered email/password.</p>
          <p style="margin-top:16px">Thanks,<br/>VegFru Team</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send notification";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
