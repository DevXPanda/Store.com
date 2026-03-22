import { NextRequest, NextResponse } from "next/server";

function validate(data: Record<string, unknown>): string | null {
  if (!data.name || String(data.name).trim().length < 2) return "Name must be at least 2 characters";
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) return "Valid email required";
  if (!data.password || String(data.password).length < 6) return "Password must be at least 6 characters";
  if (String(data.password).length > 128) return "Password too long";
  if (String(data.name).length > 100) return "Name too long";
  return null;
}

/** Legacy endpoint — accounts are created after email OTP via /api/auth/otp/email/verify */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationError = validate(body);
    if (validationError) return NextResponse.json({ success: false, error: validationError }, { status: 400 });

    return NextResponse.json(
      {
        success: false,
        error:
          "Use Create account and confirm with the verification code sent to your email.",
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ success: false, error: "Server error. Try again." }, { status: 500 });
  }
}
