"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
};

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const contactId = params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["supportContact", contactId],
    queryFn: () => api.get<Contact>(`/dashboard/support/contacts/${contactId}`),
    enabled: Boolean(contactId)
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/dashboard/support/contacts/${contactId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supportContacts"] });
      router.replace("/moderation");
    }
  });

  const onDelete = () => {
    const confirmed = window.confirm("Deseja apagar este contato?");
    if (confirmed) {
      deleteMutation.mutate(undefined, {
        onError: () => alert("Não foi possível apagar o contato.")
      });
    }
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;
  if (error || !data) return <div className="p-4 text-red-600">Erro ao carregar contato.</div>;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader
        title={`Contato #${data.id}`}
        subtitle={data.createdAt ? new Date(data.createdAt).toLocaleString() : "-"}
        actions={
          <button
            onClick={onDelete}
            disabled={deleteMutation.isPending}
            className="rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Apagando..." : "Apagar"}
          </button>
        }
      />

      <GlassCard className="space-y-4">
        <Field label="Nome" value={data.name} />
        <Field label="Email" value={data.email} />
        <Field label="Mensagem" value={data.message} multiline />
      </GlassCard>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className={`mt-1 text-sm text-white ${multiline ? "whitespace-pre-wrap" : ""}`}>{value || "-"}</p>
    </div>
  );
}
