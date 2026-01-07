"use client";
import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { isDevDomain } from "@/lib/apiBase";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/dashboard/Pill";

type PushType = "guide_content" | "store";
type PushEnvironment = "DEV" | "STAGING" | "PROD";
type PushAudience = "promos" | "new_stores";
type PushMode = "token" | "user" | "broadcast";

type PushHistoryItem = {
  id: string;
  mode: PushMode;
  target: string;
  environment?: PushEnvironment;
  audience?: PushAudience;
  type: PushType;
  title: string;
  body: string;
  createdAt: string;
  status: "success" | "error";
  error?: string;
};

const ENV_OPTIONS: PushEnvironment[] = ["DEV", "STAGING", "PROD"];

export default function PushPage() {
  const defaultEnv = useMemo<PushEnvironment>(() => (isDevDomain() ? "DEV" : "PROD"), []);
  const [tokenForm, setTokenForm] = useState({
    token: "",
    title: "",
    body: "",
    type: "guide_content" as PushType,
    id: ""
  });
  const [userForm, setUserForm] = useState({
    userId: "",
    environment: defaultEnv,
    title: "",
    body: "",
    type: "guide_content" as PushType,
    id: ""
  });
  const [broadcastForm, setBroadcastForm] = useState({
    audience: "promos" as PushAudience,
    environment: defaultEnv,
    title: "",
    body: "",
    type: "guide_content" as PushType,
    id: ""
  });
  const [history, setHistory] = useState<PushHistoryItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const addHistory = (item: PushHistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 10));
  };

  const sendTokenMutation = useMutation({
    mutationFn: async () => {
      await api.post("/dashboard/push", {
        token: tokenForm.token.trim(),
        title: tokenForm.title.trim(),
        body: tokenForm.body.trim(),
        type: tokenForm.type,
        id: tokenForm.id.trim()
      });
    },
    onSuccess: () => {
      setStatusMessage("Push enviado para o token.");
      setErrorMessage(null);
      addHistory({
        id: newId(),
        mode: "token",
        target: tokenForm.token.trim(),
        type: tokenForm.type,
        title: tokenForm.title.trim(),
        body: tokenForm.body.trim(),
        createdAt: new Date().toISOString(),
        status: "success"
      });
    },
    onError: (error: any) => {
      const message = error?.message ?? "Falha ao enviar push.";
      setErrorMessage(message);
      setStatusMessage(null);
      addHistory({
        id: newId(),
        mode: "token",
        target: tokenForm.token.trim(),
        type: tokenForm.type,
        title: tokenForm.title.trim(),
        body: tokenForm.body.trim(),
        createdAt: new Date().toISOString(),
        status: "error",
        error: message
      });
    }
  });

  const sendUserMutation = useMutation({
    mutationFn: async () => {
      await api.post("/dashboard/push/user", {
        userId: userForm.userId.trim(),
        environment: userForm.environment,
        title: userForm.title.trim(),
        body: userForm.body.trim(),
        type: userForm.type,
        id: userForm.id.trim()
      });
    },
    onSuccess: () => {
      setStatusMessage("Push enviado para o usuário.");
      setErrorMessage(null);
      addHistory({
        id: newId(),
        mode: "user",
        target: userForm.userId.trim(),
        environment: userForm.environment,
        type: userForm.type,
        title: userForm.title.trim(),
        body: userForm.body.trim(),
        createdAt: new Date().toISOString(),
        status: "success"
      });
    },
    onError: (error: any) => {
      const message = error?.message ?? "Falha ao enviar push.";
      setErrorMessage(message);
      setStatusMessage(null);
      addHistory({
        id: newId(),
        mode: "user",
        target: userForm.userId.trim(),
        environment: userForm.environment,
        type: userForm.type,
        title: userForm.title.trim(),
        body: userForm.body.trim(),
        createdAt: new Date().toISOString(),
        status: "error",
        error: message
      });
    }
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async () => {
      await api.post("/dashboard/push/broadcast", {
        environment: broadcastForm.environment,
        audience: broadcastForm.audience,
        title: broadcastForm.title.trim(),
        body: broadcastForm.body.trim(),
        type: broadcastForm.type,
        id: broadcastForm.id.trim()
      });
    },
    onSuccess: () => {
      setStatusMessage("Push enviado para o público.");
      setErrorMessage(null);
      addHistory({
        id: newId(),
        mode: "broadcast",
        target: broadcastForm.audience,
        environment: broadcastForm.environment,
        audience: broadcastForm.audience,
        type: broadcastForm.type,
        title: broadcastForm.title.trim(),
        body: broadcastForm.body.trim(),
        createdAt: new Date().toISOString(),
        status: "success"
      });
    },
    onError: (error: any) => {
      const message = error?.message ?? "Falha ao enviar push.";
      setErrorMessage(message);
      setStatusMessage(null);
      addHistory({
        id: newId(),
        mode: "broadcast",
        target: broadcastForm.audience,
        environment: broadcastForm.environment,
        audience: broadcastForm.audience,
        type: broadcastForm.type,
        title: broadcastForm.title.trim(),
        body: broadcastForm.body.trim(),
        createdAt: new Date().toISOString(),
        status: "error",
        error: message
      });
    }
  });

  const canSendToken =
    tokenForm.token.trim().length > 0 &&
    tokenForm.title.trim().length > 0 &&
    tokenForm.body.trim().length > 0 &&
    tokenForm.id.trim().length > 0;
  const canSendUser =
    userForm.userId.trim().length > 0 &&
    userForm.title.trim().length > 0 &&
    userForm.body.trim().length > 0 &&
    userForm.id.trim().length > 0;
  const canSendBroadcast =
    broadcastForm.title.trim().length > 0 &&
    broadcastForm.body.trim().length > 0 &&
    broadcastForm.id.trim().length > 0;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-textDark">
      <PageHeader title="Notificações" subtitle="Envie pushes para QA e produção. Todos os envios exigem type + id para roteamento." />

      {statusMessage ? <Pill className="bg-emerald-100 text-emerald-700">{statusMessage}</Pill> : null}
      {errorMessage ? <Pill className="bg-red-100 text-red-700">{errorMessage}</Pill> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="space-y-4">
          <div>
            <p className="text-lg font-semibold text-white">Enviar por token</p>
            <p className="text-sm text-white/70">Use para testes diretos em um dispositivo.</p>
          </div>
          <Field label="Token" value={tokenForm.token} onChange={(v) => setTokenForm({ ...tokenForm, token: v })} />
          <Field label="Título" value={tokenForm.title} onChange={(v) => setTokenForm({ ...tokenForm, title: v })} />
          <Field label="Mensagem" value={tokenForm.body} onChange={(v) => setTokenForm({ ...tokenForm, body: v })} multiline />
          <SelectField
            label="Tipo"
            value={tokenForm.type}
            onChange={(v) => setTokenForm({ ...tokenForm, type: v as PushType })}
            options={[
              { value: "guide_content", label: "guide_content" },
              { value: "store", label: "store" }
            ]}
          />
          <Field label="ID do conteúdo/loja" value={tokenForm.id} onChange={(v) => setTokenForm({ ...tokenForm, id: v })} />
          <button
            type="button"
            onClick={() => sendTokenMutation.mutate()}
            disabled={!canSendToken || sendTokenMutation.isPending}
            className="w-full rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
          >
            {sendTokenMutation.isPending ? "Enviando..." : "Enviar push"}
          </button>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div>
            <p className="text-lg font-semibold text-white">Enviar para usuário</p>
            <p className="text-sm text-white/70">Fan-out para todos os dispositivos do usuário.</p>
          </div>
          <Field label="User ID" value={userForm.userId} onChange={(v) => setUserForm({ ...userForm, userId: v })} />
          <SelectField
            label="Ambiente"
            value={userForm.environment}
            onChange={(v) => setUserForm({ ...userForm, environment: v as PushEnvironment })}
            options={ENV_OPTIONS.map((env) => ({ value: env, label: env }))}
          />
          <Field label="Título" value={userForm.title} onChange={(v) => setUserForm({ ...userForm, title: v })} />
          <Field label="Mensagem" value={userForm.body} onChange={(v) => setUserForm({ ...userForm, body: v })} multiline />
          <SelectField
            label="Tipo"
            value={userForm.type}
            onChange={(v) => setUserForm({ ...userForm, type: v as PushType })}
            options={[
              { value: "guide_content", label: "guide_content" },
              { value: "store", label: "store" }
            ]}
          />
          <Field label="ID do conteúdo/loja" value={userForm.id} onChange={(v) => setUserForm({ ...userForm, id: v })} />
          <button
            type="button"
            onClick={() => sendUserMutation.mutate()}
            disabled={!canSendUser || sendUserMutation.isPending}
            className="w-full rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
          >
            {sendUserMutation.isPending ? "Enviando..." : "Enviar push"}
          </button>
        </GlassCard>

        <GlassCard className="space-y-4 lg:col-span-2">
          <div>
            <p className="text-lg font-semibold text-white">Broadcast por audiência</p>
            <p className="text-sm text-white/70">Envio para tópicos (promos ou new_stores).</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Audiência"
              value={broadcastForm.audience}
              onChange={(v) => setBroadcastForm({ ...broadcastForm, audience: v as PushAudience })}
              options={[
                { value: "promos", label: "promos" },
                { value: "new_stores", label: "new_stores" }
              ]}
            />
            <SelectField
              label="Ambiente"
              value={broadcastForm.environment}
              onChange={(v) => setBroadcastForm({ ...broadcastForm, environment: v as PushEnvironment })}
              options={ENV_OPTIONS.map((env) => ({ value: env, label: env }))}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Título"
              value={broadcastForm.title}
              onChange={(v) => setBroadcastForm({ ...broadcastForm, title: v })}
            />
            <Field
              label="Mensagem"
              value={broadcastForm.body}
              onChange={(v) => setBroadcastForm({ ...broadcastForm, body: v })}
              multiline
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Tipo"
              value={broadcastForm.type}
              onChange={(v) => setBroadcastForm({ ...broadcastForm, type: v as PushType })}
              options={[
                { value: "guide_content", label: "guide_content" },
                { value: "store", label: "store" }
              ]}
            />
            <Field
              label="ID do conteúdo/loja"
              value={broadcastForm.id}
              onChange={(v) => setBroadcastForm({ ...broadcastForm, id: v })}
            />
          </div>
          <button
            type="button"
            onClick={() => sendBroadcastMutation.mutate()}
            disabled={!canSendBroadcast || sendBroadcastMutation.isPending}
            className="w-full rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
          >
            {sendBroadcastMutation.isPending ? "Enviando..." : "Enviar broadcast"}
          </button>
        </GlassCard>
      </div>

      <GlassCard className="space-y-4">
        <div>
          <p className="text-lg font-semibold text-white">Envios recentes (sessão)</p>
          <p className="text-sm text-white/70">Histórico local apenas nesta sessão.</p>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-white/70">Nenhum push enviado ainda.</p>
        ) : (
          <table className="w-full text-left text-sm text-textDark">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-white/60">
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Modo</th>
                <th className="py-3 px-4">Destino</th>
                <th className="py-3 px-4">Conteúdo</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t border-black/5 hover:bg-black/5">
                  <td className="py-3 px-4 text-white">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4 text-white">{item.mode}</td>
                  <td className="py-3 px-4 text-white">
                    {item.target}
                    {item.environment ? <div className="text-xs text-white/60">{item.environment}</div> : null}
                    {item.audience ? <div className="text-xs text-white/60">{item.audience}</div> : null}
                  </td>
                  <td className="py-3 px-4 text-white">
                    <div className="font-semibold">{item.title}</div>
                    <div className="text-xs text-white/60">{item.type}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={
                        item.status === "success"
                          ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700"
                      }
                    >
                      {item.status === "success" ? "Sucesso" : "Erro"}
                    </span>
                    {item.error ? <div className="text-xs text-red-600 mt-1">{item.error}</div> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-xs uppercase tracking-wide text-white/50">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-white/80">
      <span className="text-xs uppercase tracking-wide text-white/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-black">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
