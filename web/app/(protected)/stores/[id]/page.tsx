"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ThriftStore } from "@/types/index";
import Image from "next/image";

export default function StoreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const storeId = params?.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => api.get<ThriftStore>(`/stores/${storeId}`),
    enabled: Boolean(storeId)
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/stores/${storeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
    }
  });

  const onDelete = () => {
    if (!storeId) return;
    const confirmed = window.confirm("Deseja realmente excluir este brechó?");
    if (confirmed) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["stores"] });
          router.replace("/stores");
        },
        onError: () => {
          alert("Não foi possível excluir o brechó. Tente novamente.");
        }
      });
    }
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;
  if (error || !data) return <div className="p-4 text-red-600">Erro ao carregar brechó.</div>;

  const images = (data.images ?? []).slice().sort((a, b) => {
    const ao = a.displayOrder ?? 0;
    const bo = b.displayOrder ?? 0;
    return ao - bo;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#374151]">{data.name}</h1>
          {data.tagline && <p className="text-sm text-[#6B7280]">{data.tagline}</p>}
          <p className="text-sm text-[#6B7280]">{data.addressLine || "Sem endereço"}</p>
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm"
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
        </button>
      </div>

      {data.coverImageUrl && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <Image
            src={data.coverImageUrl}
            alt="Cover"
            width={1200}
            height={600}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-gray-200 rounded-xl p-4">
        <Field label="Descrição" value={data.description} />
        <Field label="Bairro" value={data.neighborhood} />
        <Field label="Telefone" value={data.phone} />
        <Field label="Whatsapp" value={data.whatsapp} />
        <Field label="Email" value={data.email} />
        <Field label="Instagram" value={data.instagram} />
        <Field label="Facebook" value={data.facebook ?? undefined} />
        <Field label="Website" value={data.website} />
        <Field label="Horário" value={data.openingHours} />
        <Field label="Categorias" value={(data.categories || []).join(", ") || undefined} />
        <Field
          label="Coordenadas"
          value={
            data.latitude != null && data.longitude != null ? `${data.latitude}, ${data.longitude}` : undefined
          }
        />
        <Field label="Avaliação" value={data.rating != null ? `${data.rating} (${data.reviewCount ?? 0})` : undefined} />
        <Field label="Badge" value={data.badgeLabel ?? undefined} />
        <Field label="Favorito" value={data.isFavorite != null ? (data.isFavorite ? "Sim" : "Não") : undefined} />
        <Field
          label="Criado em"
          value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined}
        />
      </div>

      {images.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-[#374151]">Imagens</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <Image
                  src={img.url}
                  alt={`Imagem ${img.id}`}
                  width={400}
                  height={300}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                {img.isCover && (
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Capa
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase text-[#9CA3AF] font-semibold">{label}</p>
      <p className="text-sm text-[#374151] mt-1">{value || "-"}</p>
    </div>
  );
}
