"use client";

import { useState, useEffect } from "react";

export async function convexQuery(path: string, args: object = {}) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  try {
    const r = await fetch(`${url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    });
    const j = await r.json();
    return j.value;
  } catch {
    return null;
  }
}

export function useConvexQuery<T>(path: string, args: object = {}) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      setLoading(false);
      return;
    }
    fetch(`${url}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, args }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setData(j.value as T);
      })
      .catch(() => {
        if (!cancelled) setData(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path, JSON.stringify(args)]);
  return { data, loading };
}
