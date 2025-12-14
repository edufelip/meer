"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User, PageResponse } from "@/types/index";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { EmptyStateRow } from "@/components/dashboard/EmptyStateRow";

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["users", page, search, sort],
    queryFn: () =>
      api.get<PageResponse<User>>(
        `/dashboard/users?page=${page}&pageSize=20&sort=${sort}${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const items = data?.items ?? [];

  const submitSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10">
      <PageHeader
        title="Usuários"
        subtitle="Gerencie contas, privilégios e donos de brechó."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                }
              }}
              className="w-64 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              placeholder="Buscar por nome ou email"
            />
            <select
              value={sort}
              onChange={(e) => {
                setPage(0);
                setSort(e.target.value as "newest" | "oldest");
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            >
              <option className="text-black" value="newest">
                Mais recentes
              </option>
              <option className="text-black" value="oldest">
                Mais antigos
              </option>
            </select>
            <button
              onClick={submitSearch}
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white"
            >
              Buscar
            </button>
          </div>
        }
      />

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left text-sm text-white/90">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-white/60">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Papel</th>
              <th className="py-3 px-4">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-3 px-4" colSpan={3}>
                  Carregando...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="py-3 px-4 text-red-300" colSpan={3}>
                  Erro ao carregar usuários
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <EmptyStateRow colSpan={5} title="Nenhum usuário encontrado" description="Ajuste a busca ou cadastre novos usuários." />
            )}
            {items.map((u) => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-xs text-white/60">{u.id}</td>
                <td className="py-3 px-4 font-semibold text-white">
                  <Link href={`/users/${u.id}`} className="text-brand-primary hover:underline">
                    {u.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-white/70">{u.email}</td>
                <td className="py-3 px-4 text-white/70">{u.role ?? "-"}</td>
                <td className="py-3 px-4 text-white/70">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
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
          Página {page + 1} {data?.hasNext ? "" : "(última)"}
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
