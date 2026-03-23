"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuperAdminLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?signin=1");
  }, [router]);

  return null;
}
