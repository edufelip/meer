"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ThriftStore, PageResponse } from "@/types/index";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { EmptyStateRow } from "@/components/dashboard/EmptyStateRow";

export default function StoresPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const { data, isLoading, error } = useQuery({
    queryKey: ["stores", page, search, sort],
    queryFn: () =>
      api.get<PageResponse<ThriftStore>>(
        `/dashboard/stores?page=${page}&pageSize=20&sort=${sort}${search ? `&search=${encodeURIComponent(search)}` : ""}`
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
        title="Brechós"
        subtitle="Listar e moderar brechós cadastrados na plataforma."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/stores/new"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-textDark transition hover:scale-[1.01] hover:bg-black/5"
            >
              Novo brechó
            </Link>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                }
              }}
              className="w-64 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-textDark placeholder:text-textSubtle/70 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              placeholder="Buscar por nome, endereço ou dono"
            />
            <select
              value={sort}
              onChange={(e) => {
                setPage(0);
                setSort(e.target.value as "newest" | "oldest");
              }}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-textDark focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
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
        <table className="w-full text-left text-sm text-textDark">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-white/60">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Endereço</th>
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
                  Erro ao carregar brechós
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <EmptyStateRow colSpan={4} title="Nenhum brechó encontrado" description="Tente ajustar o termo de busca." />
            )}
            {items.map((s) => (
              <tr key={s.id} className="border-t border-black/5 hover:bg-black/5">
                <td className="py-3 px-4 text-xs text-white">{s.id}</td>
                <td className="py-3 px-4 font-semibold text-textDark">
                  <Link href={`/stores/${s.id}`} className="text-brand-primary hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-white">{s.addressLine ?? "-"}</td>
                <td className="py-3 px-4 text-white">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <div className="flex items-center justify-between text-sm text-textDark">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <div>
          Página {page + 1} {data?.hasNext ? "" : "(última)"}
        </div>
        <button
          disabled={!data?.hasNext}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
