"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

export default function HomeRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        await api.get("/auth/me");
        if (!active) return;
        router.replace("/dashboard");
      } catch {
        clearToken();
        router.replace("/login");
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  // Keep the layout background while we decide where to send the user
  return <div className="min-h-screen bg-background" aria-busy="true" />;
}
