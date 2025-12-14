"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types/index";
import Link from "next/link";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/dashboard/Pill";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id as string;
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.get<User>(`/dashboard/users/${userId}`),
    enabled: Boolean(userId)
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/dashboard/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      router.replace("/users");
    }
  });

  const onDelete = () => {
    const confirmed = window.confirm("Deseja excluir este usuário?");
    if (!confirmed) return;
    deleteMutation.mutate(undefined, {
      onError: () => alert("Não foi possível excluir o usuário.")
    });
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;
  if (error || !data) return <div className="p-4 text-red-600">Erro ao carregar usuário.</div>;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader
        title={data.name}
        subtitle={data.email}
        actions={
          <button
            onClick={onDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </button>
        }
      />

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <Pill>ID {data.id}</Pill>
          {data.role ? <Pill className="bg-brand-primary/20 text-brand-primary">{data.role}</Pill> : null}
          {data.notifyNewStores ? <Pill>Notificar novos brechós</Pill> : null}
          {data.notifyPromos ? <Pill>Notificar promoções</Pill> : null}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Email" value={data.email} />
          <Field label="Bio" value={data.bio ?? undefined} />
          <Field label="Avatar" value={data.avatarUrl ?? undefined} />
          <Field label="Criado em" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined} />
        </div>
      </GlassCard>

      {data.ownedThriftStore && (
        <GlassCard className="space-y-3">
          <p className="text-sm font-semibold text-white">Brechó do usuário</p>
          <Link href={`/stores/${data.ownedThriftStore.id}`} className="text-brand-primary hover:underline">
            {data.ownedThriftStore.name}
          </Link>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="ID" value={data.ownedThriftStore.id} />
            <Field
              label="Criado em"
              value={
                data.ownedThriftStore.createdAt
                  ? new Date(data.ownedThriftStore.createdAt).toLocaleString()
                  : undefined
              }
            />
            <Field label="Endereço" value={data.ownedThriftStore.addressLine ?? undefined} />
            <Field label="Categorias" value={(data.ownedThriftStore.categories || []).join(", ") || undefined} />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-sm text-white">{value || "-"}</p>
    </div>
  );
}

function fmtBool(value?: boolean) {
  if (value === undefined || value === null) return undefined;
  return value ? "Sim" : "Não";
}
