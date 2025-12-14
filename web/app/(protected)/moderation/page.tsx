"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { EmptyStateRow } from "@/components/dashboard/EmptyStateRow";

type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
};

type PageResponse<T> = {
  items: T[];
  page: number;
  hasNext: boolean;
};

export default function ModerationPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["supportContacts", page],
    queryFn: () => api.get<PageResponse<Contact>>(`/dashboard/support/contacts?page=${page}&pageSize=20`),
    placeholderData: (prev) => prev
  });

  const items = data?.items ?? [];

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader title="Moderação" subtitle="Fila de contatos e solicitações do público." />

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left text-sm text-white/90">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-white/60">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Mensagem</th>
              <th className="py-3 px-4">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-3 px-4" colSpan={5}>
                  Carregando...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="py-3 px-4 text-red-300" colSpan={5}>
                  Erro ao carregar contatos
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <EmptyStateRow colSpan={5} title="Nenhum contato encontrado" description="Ainda não há mensagens para revisar." />
            )}
            {items.map((c) => (
              <tr key={c.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-xs text-white/60">
                  <Link href={`/moderation/${c.id}`} className="text-brand-primary hover:underline">
                    {c.id}
                  </Link>
                </td>
                <td className="py-3 px-4 font-semibold text-white">{c.name}</td>
                <td className="py-3 px-4 text-white/70">{c.email}</td>
                <td className="py-3 px-4 text-white/90">{c.message}</td>
                <td className="py-3 px-4 text-white/70">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="flex items-center justify-between text-sm text-white">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <div>
          Página {data ? data.page : page + 1} {data?.hasNext ? "" : "(última)"}
        </div>
        <button
          disabled={!data?.hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
