import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { normalizeE164 } from "@/lib/phone";
import { checkOtpSms } from "@/lib/twilioVerify";
import { createPendingSessionToken } from "@/lib/adminPendingSession";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vegfru-dev-secret"
);

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = (await req.json()) as {
      phone?: string;
      otp?: string;
    };
    const e164 = normalizeE164(phone || "");
    if (!e164 || !otp || !/^\d{4,8}$/.test(otp)) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone or OTP" },
        { status: 400 }
      );
    }

    const check = await checkOtpSms(e164, otp);
    if (check.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "Incorrect or expired OTP" },
        { status: 401 }
      );
    }

    if (!CONVEX_URL) {
      return NextResponse.json(
        { ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" },
        { status: 500 }
      );
    }

    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "adminAuth:ensureDefaultSuperAdmin", args: {} }),
    }).catch(() => {});

    const adminRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "adminPhoneAuth:getAdminByPhone",
        args: { phone: e164 },
      }),
    });
    const adminOut = await adminRes.json();
    const admin = adminOut.value as
      | {
          _id: string;
          name: string;
          email: string;
          role: string;
          isActive: boolean;
        }
      | null
      | undefined;

    if (admin && admin.role === "superadmin") {
      return NextResponse.json(
        {
          ok: false,
          error: "This number belongs to Super Admin. Use superadmin panel.",
        },
        { status: 403 }
      );
    }

    if (admin && admin.role === "admin" && admin.isActive) {
      const token = await new SignJWT({
        userId: admin._id,
        role: admin.role,
        name: admin.name,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .setIssuedAt()
        .sign(JWT_SECRET);

      await fetch(`${CONVEX_URL}/api/mutation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "adminAuth:updateAdminLastLogin",
          args: { id: admin._id },
        }),
      }).catch(() => {});

      const res = NextResponse.json({
        ok: true,
        next: "admin" as const,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
      res.cookies.set("vegfru_token", token, {
        path: "/",
        maxAge: 7 * 86400,
        sameSite: "strict",
        httpOnly: false,
      });
      res.cookies.set(
        "vegfru_user",
        JSON.stringify({
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        }),
        { path: "/", maxAge: 7 * 86400, sameSite: "strict" }
      );
      res.cookies.set("vegfru_pending_session", "", {
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    const obRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "adminPhoneAuth:getOnboardingStatusByPhone",
        args: { phone: e164 },
      }),
    });
    const obOut = await obRes.json();
    const ob = obOut.value as { status: string } | null | undefined;

    if (ob?.status === "pending") {
      const pendingTok = await createPendingSessionToken(e164);
      const res = NextResponse.json({
        ok: true,
        next: "pending" as const,
      });
      res.cookies.set("vegfru_pending_session", pendingTok, {
        path: "/",
        maxAge: 7 * 86400,
        sameSite: "strict",
        httpOnly: true,
      });
      res.cookies.set("vegfru_otp_session", "", {
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    const otpSession = await new SignJWT({
      sub: "admin_otp_ok",
      phone: e164,
      typ: "onboarding",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("20m")
      .setIssuedAt()
      .sign(JWT_SECRET);

    const res = NextResponse.json({ ok: true, next: "onboarding" as const });
    res.cookies.set("vegfru_otp_session", otpSession, {
      path: "/",
      maxAge: 20 * 60,
      sameSite: "strict",
      httpOnly: true,
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
