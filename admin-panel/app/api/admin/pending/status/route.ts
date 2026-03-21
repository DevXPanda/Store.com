import { NextRequest, NextResponse } from "next/server";
import { verifyPendingSessionToken } from "@/lib/adminPendingSession";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export async function GET(req: NextRequest) {
  try {
    const raw = req.cookies.get("vegfru_pending_session")?.value;
    if (!raw) {
      return NextResponse.json(
        { ok: false, error: "No pending session" },
        { status: 401 }
      );
    }
    const phone = await verifyPendingSessionToken(raw);
    if (!CONVEX_URL) {
      return NextResponse.json(
        { ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" },
        { status: 500 }
      );
    }
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "adminPhoneAuth:getOnboardingStatusByPhone",
        args: { phone },
      }),
    });
    const out = await res.json();
    const data = out.value as
      | {
          status: "none" | "pending" | "approved" | "rejected";
          submittedAt?: number;
          applicationId?: string;
        }
      | undefined;

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Could not load status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      phone,
      status: data.status,
      submittedAt: data.submittedAt,
      applicationId: data.applicationId,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid or expired session" },
      { status: 401 }
    );
  }
}
