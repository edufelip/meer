"use client";
import { getToken, setRefreshToken, setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setCheckingSession] = useState(true);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_PROXY ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "/api";
  const appPackage = process.env.NEXT_PUBLIC_APP_PACKAGE || process.env.EXPO_PUBLIC_APP_PACKAGE || "com.edufelip.meer";

  // If already logged, redirect to dashboard
  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setCheckingSession(false);
      return;
    }
    (async () => {
      try {
        await api.get("/auth/me");
        router.replace("/dashboard");
      } catch {
        // ignore, stay on login
      } finally {
        setCheckingSession(false);
      }
    })();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/dashboard/login`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-App-Package": appPackage
        },
        body: JSON.stringify({ email, password })
      });

      if (res.status === 401) {
        setError("Credenciais inválidas.");
        return;
      }
      if (res.status === 403) {
        setError("Acesso apenas para administradores.");
        return;
      }
      if (!res.ok) {
        setError("Não foi possível entrar.");
        return;
      }

      const data = (await res.json()) as { token: string; refreshToken?: string; user?: { role?: string } };
      if (data.user?.role && data.user.role.toLowerCase() !== "admin") {
        setError("Acesso apenas para administradores.");
        return;
      }
      setToken(data.token);
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      router.replace("/dashboard");
    } catch {
      setError("Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6] px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white shadow rounded-xl px-8 py-10 w-full max-w-md space-y-4"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-[#374151]">Meer Admin</h1>
          <p className="text-sm text-[#6B7280]">Acesse com sua conta de administrador</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#374151] font-semibold">Email</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#374151] font-semibold">Senha</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B55D05] text-white font-semibold py-2 rounded-lg hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
