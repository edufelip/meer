"use client";
import { getToken, setRefreshToken, setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { selectApiBase } from "@/lib/apiBase";
import { AuthField } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { DashboardIcon } from "@/components/dashboard/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setCheckingSession] = useState(true);

  const baseUrl = selectApiBase();
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
    <AuthShell>
      <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-[1.05fr,0.95fr] items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 backdrop-blur">
            <DashboardIcon className="h-6 w-6 text-brand-primary" />
            <span>Guia Brechó · Painel Admin</span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Entre para gerenciar<br />o ecossistema Guia Brechó
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Acesse seus painéis de brechós, conteúdos, usuários e moderação em um ambiente seguro e unificado.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-white/60">
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Acesso restrito a admins</span>
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Sessões seguras</span>
            <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">Suporte 24/7</span>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="relative space-y-5 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.8)] backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Bem-vindo de volta</p>
              <h2 className="font-display text-2xl font-bold text-white">Faça login</h2>
            </div>
            <div className="rounded-full bg-brand-primary/15 px-3 py-1 text-xs font-semibold text-brand-primary ring-1 ring-brand-primary/30">
              Ambiente seguro
            </div>
          </div>

          <AuthField
            label="Email"
            type="email"
            value={email}
            placeholder="admin@guia.com"
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <AuthField
            label="Senha"
            type="password"
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-xs text-white/50">
            Ao continuar, você confirma que está autorizado a operar este painel.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
