/**
 * Transactional email via Nodemailer (SMTP) — OTP, order updates, password reset.
 * Set SMTP_HOST, SMTP_USER, SMTP_PASS in frontend/.env.local (never commit secrets).
 *
 * Gmail: use smtp.gmail.com:587, SMTP_USER = full address, SMTP_PASS = 16-char App Password
 * (Google Account → Security → 2-Step Verification → App passwords). Normal passwords fail with 535.
 *
 * Optional: SMTP_PORT (default 587), SMTP_SECURE=true for port 465.
 * From address: FROM_EMAIL or SMTP_FROM, else SMTP_USER.
 */

import nodemailer from "nodemailer";

type SmtpErr = Error & { code?: string; responseCode?: number };

export type SendMailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return !!(host && user && pass);
}

/** Visible From: must be allowed by your SMTP provider. */
export function getMailFrom(): string {
  return (
    process.env.FROM_EMAIL?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "noreply@localhost"
  );
}

let cached: nodemailer.Transporter | null = null;

function clearTransportCache() {
  cached = null;
}

function getTransport(): nodemailer.Transporter | null {
  if (!isSmtpConfigured()) return null;
  if (cached) return cached;
  const host = process.env.SMTP_HOST!.trim();
  const hostLower = host.toLowerCase();
  const isGmail = hostLower === "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
    ...(isGmail && !secure
      ? {
          requireTLS: true,
          tls: { minVersion: "TLSv1.2" as const },
        }
      : {}),
  });
  return cached;
}

function friendlySmtpError(err: unknown): string {
  const e = err as SmtpErr;
  if (e.code === "EAUTH" || e.responseCode === 535) {
    return (
      "SMTP login failed. For Gmail: create an App Password (Google Account → Security → " +
      "2-Step Verification → App passwords), set SMTP_PASS to that 16-character password " +
      "(no spaces), SMTP_USER to your full Gmail address, and use host smtp.gmail.com port 587."
    );
  }
  return e.message || "Failed to send email";
}

/** OTP, order confirmation, password reset, etc. */
export async function sendMail(params: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<SendMailResult> {
  const transport = getTransport();
  if (!transport) {
    console.warn("[mail] SMTP not configured — email skipped (dev)");
    return { ok: false, error: "Email not configured" };
  }

  const to = Array.isArray(params.to) ? params.to : [params.to];
  try {
    const info = await transport.sendMail({
      from: `VegFru <${getMailFrom()}>`,
      to: to.join(", "),
      subject: params.subject,
      html: params.html,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error("[mail]", err);
    const e = err as SmtpErr;
    if (e.code === "EAUTH" || e.responseCode === 535) {
      clearTransportCache();
    }
    return { ok: false, error: friendlySmtpError(err) };
  }
}

export async function sendOtpEmail(params: {
  to: string;
  code: string;
  name?: string;
}): Promise<SendMailResult> {
  const subject = "Your VegFru verification code";
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8fafc;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
    <div style="font-size:22px;font-weight:700;color:#14532d;margin-bottom:8px;">🌿 VegFru</div>
    <p style="color:#334155;font-size:15px;line-height:1.5;">Hi${params.name ? ` ${escapeHtml(params.name)}` : ""},</p>
    <p style="color:#334155;font-size:15px;">Use this code to verify your email and finish creating your account:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#14532d;background:#f0fdf4;padding:14px 28px;border-radius:12px;border:1px solid #bbf7d0;">${escapeHtml(params.code)}</span>
    </div>
    <p style="color:#64748b;font-size:13px;">This code expires in 10 minutes. If you didn&apos;t request it, you can ignore this email.</p>
  </div></body></html>`;

  return sendMail({ to: params.to, subject, html });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
