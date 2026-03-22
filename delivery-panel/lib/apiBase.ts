/** See frontend: optional Render API base for shared user-table login. */
export function apiUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p;
  return `${base}${p}`;
}
