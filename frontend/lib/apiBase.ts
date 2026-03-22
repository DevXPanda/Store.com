/**
 * Optional Render (or other) API origin. When set in Vercel, `/api/auth/login` for the
 * storefront hits that host (same Convex + JWT as this app). Leave unset to use same-origin `/api/*`.
 * Do not use for admin/superadmin — their login routes differ from Render.
 */
export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
