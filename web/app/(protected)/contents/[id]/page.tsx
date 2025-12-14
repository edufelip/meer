"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GuideContent } from "@/types/index";
import Image from "next/image";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const contentId = params?.id as string;
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["content", contentId],
    queryFn: () => api.get<GuideContent>(`/dashboard/contents/${contentId}`),
    enabled: Boolean(contentId)
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/dashboard/contents/${contentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      router.replace("/contents");
    }
  });

  const onDelete = () => {
    const confirmed = window.confirm("Deseja excluir este conteúdo?");
    if (!confirmed) return;
    deleteMutation.mutate(undefined, {
      onError: () => alert("Não foi possível excluir o conteúdo.")
    });
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;
  if (error || !data) return <div className="p-4 text-red-600">Erro ao carregar conteúdo.</div>;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader
        title={data.title}
        subtitle={data.thriftStoreName ?? data.thriftStoreId}
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

      {data.imageUrl && (
        <GlassCard className="overflow-hidden p-0">
          <Image
            src={data.imageUrl}
            alt={data.title}
            width={1200}
            height={640}
            className="h-72 w-full object-cover"
          />
        </GlassCard>
      )}

      <GlassCard className="space-y-4">
        <Field label="ID" value={data.id} />
        <Field label="Descrição" value={data.description} multiline />
        <Field label="Loja" value={data.thriftStoreName ?? data.thriftStoreId} />
        <Field label="Criado em" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined} />
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
