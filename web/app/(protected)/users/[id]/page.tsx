"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/types/index";
import Link from "next/link";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#374151]">{data.name}</h1>
          <p className="text-sm text-[#6B7280]">{data.email}</p>
        </div>
        <button
          onClick={onDelete}
          disabled={deleteMutation.isPending}
          className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm"
        >
          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-gray-200 rounded-xl p-4">
        <Field label="ID" value={data.id} />
        <Field label="Email" value={data.email} />
        <Field label="Papel" value={data.role ?? "-"} />
        <Field label="Bio" value={data.bio ?? undefined} />
        <Field label="Avatar" value={data.avatarUrl ?? undefined} />
        <Field label="Notificar novos brechós" value={fmtBool(data.notifyNewStores)} />
        <Field label="Notificar promoções" value={fmtBool(data.notifyPromos)} />
        <Field label="Criado em" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined} />
      </div>

      {data.ownedThriftStore && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-[#374151]">Brechó do usuário</p>
          <Link href={`/stores/${data.ownedThriftStore.id}`} className="text-[#B55D05] hover:underline">
            {data.ownedThriftStore.name}
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <Field
              label="Categorias"
              value={(data.ownedThriftStore.categories || []).join(", ") || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-[#9CA3AF] font-semibold">{label}</p>
      <p className="text-sm text-[#374151] mt-1">{value || "-"}</p>
    </div>
  );
}

function fmtBool(value?: boolean) {
  if (value === undefined || value === null) return undefined;
  return value ? "Sim" : "Não";
}
