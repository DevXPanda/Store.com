import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vegfru-dev-secret"
);

export async function GET(req: NextRequest) {
  const c = req.cookies.get("vegfru_otp_session")?.value;
  if (!c) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const { payload } = await jwtVerify(c, JWT_SECRET);
    if (payload.typ !== "onboarding" || payload.sub !== "admin_otp_ok") {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    const phone = String(payload.phone || "");
    return NextResponse.json({ ok: true, phone });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
