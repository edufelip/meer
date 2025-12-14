"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ThriftStore } from "@/types/index";
import Image from "next/image";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/dashboard/Pill";

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
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader
        title={data.name}
        subtitle={data.tagline || data.addressLine || "Detalhes do brechó"}
        actions={
          <button
            onClick={onDelete}
            className="rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </button>
        }
      />

      {data.coverImageUrl && (
        <GlassCard className="overflow-hidden p-0">
          <Image
            src={data.coverImageUrl}
            alt="Cover"
            width={1200}
            height={520}
            className="h-64 w-full object-cover sm:h-80"
          />
        </GlassCard>
      )}

      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          <Pill>{data.addressLine || "Sem endereço"}</Pill>
          {data.badgeLabel ? <Pill className="bg-brand-primary/20 text-brand-primary">{data.badgeLabel}</Pill> : null}
          {data.isFavorite != null ? (
            <Pill className={data.isFavorite ? "text-brand-primary" : "text-white/70"}>
              {data.isFavorite ? "Favorito" : "Não favorito"}
            </Pill>
          ) : null}
          {data.rating != null ? (
            <Pill>
              Avaliação {data.rating} ({data.reviewCount ?? 0})
            </Pill>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          <Field
            label="Criado em"
            value={data.createdAt ? new Date(data.createdAt).toLocaleString() : undefined}
          />
        </div>
      </GlassCard>

      {images.length > 0 && (
        <GlassCard className="space-y-4">
          <p className="text-sm font-semibold text-white">Imagens</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="relative overflow-hidden rounded-xl border border-white/10">
                <Image
                  src={img.url}
                  alt={`Imagem ${img.id}`}
                  width={400}
                  height={300}
                  className="h-32 w-full object-cover"
                />
                {img.isCover && (
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">Capa</span>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 text-sm text-white">{value || "-"}</p>
    </div>
  );
}
