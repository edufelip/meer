"use client";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { EmptyStateRow } from "@/components/dashboard/EmptyStateRow";

type Category = { id: string; nameStringId: string; imageResId: string; createdAt?: string };
type PageResponse<T> = { items: T[]; page: number; hasNext: boolean };

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [idInput, setIdInput] = useState("");
  const [nameStringIdInput, setNameStringIdInput] = useState("");
  const [imageResIdInput, setImageResIdInput] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["categories", page],
    queryFn: () => api.get<PageResponse<Category>>(`/dashboard/categories?page=${page}&pageSize=50`),
    placeholderData: (prev) => prev
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const body = {
        id: idInput,
        nameStringId: nameStringIdInput,
        imageResId: imageResIdInput
      };
      if (editId) {
        await api.put(`/dashboard/categories/${editId}`, body);
      } else {
        await api.post("/dashboard/categories", body);
      }
    },
    onSuccess: () => {
      setIdInput("");
      setNameStringIdInput("");
      setImageResIdInput("");
      setEditId(null);
      qc.invalidateQueries({ queryKey: ["categories"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/dashboard/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] })
  });

  const items = data?.items ?? [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idInput.trim() || !nameStringIdInput.trim() || !imageResIdInput.trim()) return;
    upsertMutation.mutate();
  };

  const onDelete = (id: string) => {
    const confirmed = window.confirm("Deseja apagar esta categoria?");
    if (!confirmed) return;
    deleteMutation.mutate(id, {
      onError: () => alert("Não foi possível apagar a categoria.")
    });
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setIdInput(cat.id);
    setNameStringIdInput(cat.nameStringId);
    setImageResIdInput(cat.imageResId);
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader title="Categorias" subtitle="Crie e edite categorias utilizadas pelos apps." />

      <GlassCard>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,1fr,1fr,auto]">
          <input
            value={idInput}
            onChange={(e) => setIdInput(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="ID (ex: casa)"
            required
          />
          <input
            value={nameStringIdInput}
            onChange={(e) => setNameStringIdInput(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="nameStringId (ex: brecho_de_casa)"
            required
          />
          <input
            value={imageResIdInput}
            onChange={(e) => setImageResIdInput(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            placeholder="imageResId (ex: brecho-categories-house)"
            required
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
            >
              {upsertMutation.isPending ? "Salvando..." : editId ? "Atualizar" : "Adicionar"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setIdInput("");
                  setNameStringIdInput("");
                  setImageResIdInput("");
                }}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <table className="w-full text-left text-sm text-white/90">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-white/60">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">nameStringId</th>
              <th className="py-3 px-4">imageResId</th>
              <th className="py-3 px-4">Criado em</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-3 px-4" colSpan={4}>
                  Carregando...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td className="py-3 px-4 text-red-300" colSpan={4}>
                  Erro ao carregar categorias
                </td>
              </tr>
            )}
            {!isLoading && !error && items.length === 0 && (
              <EmptyStateRow
                colSpan={5}
                title="Nenhuma categoria encontrada"
                description="Inclua a primeira categoria usando o formulário acima."
              />
            )}
            {items.map((cat) => (
              <tr key={cat.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-xs text-white/60">{cat.id}</td>
                <td className="py-3 px-4 text-white font-semibold">{cat.nameStringId}</td>
                <td className="py-3 px-4 text-white/70">{cat.imageResId}</td>
                <td className="py-3 px-4 text-white/70">
                  {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "-"}
                </td>
                <td className="py-3 px-4 flex gap-2">
                  <button
                    onClick={() => startEdit(cat)}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(cat.id)}
                    className="rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/30"
                  >
                    Apagar
                  </button>
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
          Página {data ? data.page : page + 1} {data?.hasNext ? "" : "(última)"}
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
