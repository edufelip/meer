"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GuideContent } from "@/types/index";
import Image from "next/image";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#374151]">{data.title}</h1>
          <p className="text-sm text-[#6B7280]">{data.thriftStoreName ?? data.thriftStoreId}</p>
        </div>
        <button
          onClick={onDelete}
          disabled={deleteMutation.isPending}
          className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm"
        >
          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        </button>
      </div>

      {data.imageUrl && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <Image
            src={data.imageUrl}
            alt={data.title}
            width={1200}
            height={640}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <Field label="ID" value={data.id} />
        <Field label="Descrição" value={data.description} multiline />
        <Field label="Loja" value={data.thriftStoreName ?? data.thriftStoreId} />
        <Field label="Criado em" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined} />
      </div>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-[#9CA3AF] font-semibold">{label}</p>
      <p className={`text-sm text-[#374151] mt-1 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value || "-"}</p>
    </div>
  );
}
