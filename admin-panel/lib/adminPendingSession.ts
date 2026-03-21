import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vegfru-dev-secret"
);

export async function createPendingSessionToken(phone: string) {
  return new SignJWT({
    sub: "admin_pending_ok",
    phone,
    typ: "admin_pending",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyPendingSessionToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  if (payload.typ !== "admin_pending" || payload.sub !== "admin_pending_ok") {
    throw new Error("Invalid pending session");
  }
  const phone = String(payload.phone || "");
  if (!phone.startsWith("+")) throw new Error("Invalid pending session");
  return phone;
}
