import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vegfru-dev-secret"
);

function pick(
  body: Record<string, unknown>,
  key: string,
  fallback = ""
): string {
  const v = body[key];
  return typeof v === "string" ? v.trim() : fallback;
}

function pickYN(
  body: Record<string, unknown>,
  key: string
): "yes" | "no" {
  const v = body[key];
  if (v === "yes" || v === "no") return v;
  return "no";
}

export async function POST(req: NextRequest) {
  try {
    let phone: string;
    try {
      const otpCookie = req.cookies.get("vegfru_otp_session")?.value;
      if (!otpCookie) {
        return NextResponse.json(
          { ok: false, error: "Session expired. Sign in with phone again." },
          { status: 401 }
        );
      }
      const { payload } = await jwtVerify(otpCookie, JWT_SECRET);
      if (payload.typ !== "onboarding" || payload.sub !== "admin_otp_ok") {
        return NextResponse.json(
          { ok: false, error: "Invalid session" },
          { status: 401 }
        );
      }
      phone = String(payload.phone || "");
      if (!phone.startsWith("+")) {
        return NextResponse.json(
          { ok: false, error: "Invalid session" },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Session expired. Sign in with phone again." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    const name = pick(body, "name");
    const email = pick(body, "email");
    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const args = {
      name,
      email,
      phone,
      dateOfBirth: pick(body, "dateOfBirth"),
      pan: pick(body, "pan"),
      pincode: pick(body, "pincode"),
      cityCurrent: pick(body, "cityCurrent"),
      cityApplying: pick(body, "cityApplying"),
      cityResidencyYears: pick(body, "cityResidencyYears"),
      educationLevel: pick(body, "educationLevel"),
      instituteName: pick(body, "instituteName") || undefined,
      occupation: pick(body, "occupation"),
      industry: pick(body, "industry"),
      workExperienceYears: pick(body, "workExperienceYears"),
      roleDescription: pick(body, "roleDescription"),
      hearAbout: pick(body, "hearAbout"),
      programUnderstanding: pick(body, "programUnderstanding"),
      whyPartner: pick(body, "whyPartner"),
      dayToDayInvolvement: pick(body, "dayToDayInvolvement"),
      timeCommitment: pick(body, "timeCommitment"),
      familyIncome: pick(body, "familyIncome"),
      investmentAmount: pick(body, "investmentAmount"),
      fundingPlan: pick(body, "fundingPlan"),
      relatedToEmployee: pickYN(body, "relatedToEmployee"),
      providesToVegFru: pickYN(body, "providesToVegFru"),
      partnerCount: pick(body, "partnerCount"),
    };

    if (!CONVEX_URL) {
      return NextResponse.json(
        { ok: false, error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const mutRes = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "adminPhoneAuth:submitOnboardingApplication",
        args,
      }),
    });

    const out = await mutRes.json();
    if (out.status === "error") {
      return NextResponse.json(
        {
          ok: false,
          error:
            (out as { errorMessage?: string }).errorMessage ||
            "Could not save profile",
        },
        { status: 400 }
      );
    }
    if (!mutRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Could not save profile" },
        { status: 400 }
      );
    }

    const { createPendingSessionToken } = await import(
      "@/lib/adminPendingSession"
    );
    const pendingTok = await createPendingSessionToken(phone);

    const res = NextResponse.json({
      ok: true,
      next: "pending_review" as const,
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
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
