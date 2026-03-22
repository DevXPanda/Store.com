const CURL = (process.env.NEXT_PUBLIC_CONVEX_URL || "").trim();

const MISSING_CONVEX_MSG =
  "Convex is not configured. Set NEXT_PUBLIC_CONVEX_URL in backend/.env.local (see backend/.env.local.example) and restart npm run dev.";

export async function convexQuery(path: string, args: object = {}) {
  if (!CURL) return null;
  try {
    const r = await fetch(`${CURL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    });
    return (await r.json()).value;
  } catch {
    return null;
  }
}

export async function convexMutation(path: string, args: object = {}) {
  if (!CURL) throw new Error(MISSING_CONVEX_MSG);
  const r = await fetch(`${CURL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  const j = (await r.json()) as { status?: string; errorMessage?: string; value?: unknown };
  if (j.status === "error" || j.errorMessage) {
    throw new Error(j.errorMessage || "Request failed");
  }
  if (!r.ok) throw new Error(await r.text());
  return j.value;
}
