"use client";
import React, { useEffect, useState } from "react";
import "../globals.css";
import { ReactQueryProvider } from "../providers";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await api.get("/auth/me");
        if (!active) return;
        setReady(true);
      } catch {
        clearToken();
        router.replace("/login");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <ReactQueryProvider>
      <main className="min-h-screen w-full bg-background text-textDark">{children}</main>
    </ReactQueryProvider>
  );
}
