"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

export function TopBar({ title }: { title: string }) {
  const router = useRouter();
  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="text-left text-xl font-bold text-[#374151] hover:opacity-80 transition-opacity"
      >
        {title}
      </button>
      <button
        className="text-sm text-[#B55D05] font-semibold"
        onClick={() => {
          clearToken();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          } else {
            router.replace("/login");
          }
        }}
      >
        Sair
      </button>
    </div>
  );
}
