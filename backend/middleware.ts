import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Allow browser clients on Vercel to call this API (e.g. storefront login). Set ALLOWED_ORIGIN to your storefront URL, or leave unset for `*`. */
function corsOrigin(): string {
  return (process.env.ALLOWED_ORIGIN || "*").trim();
}

export function middleware(req: NextRequest) {
  const origin = corsOrigin();
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
