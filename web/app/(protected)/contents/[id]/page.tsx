"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import clsx from "classnames";
import { api } from "@/lib/api";
import type { GuideContent } from "@/types/index";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

type ContentForm = {
  title: string;
  description: string;
  storeId: string;
  imageUrl: string;
  categoryLabel: string;
  type: string;
};

type ImageSlot = { uploadUrl: string; fileKey: string; contentType: string };

const emptyForm: ContentForm = {
  title: "",
  description: "",
  storeId: "",
  imageUrl: "",
  categoryLabel: "",
  type: ""
};

const MAX_IMAGE = 5 * 1024 * 1024;
const ALLOWED_IMG = ["image/jpeg", "image/png", "image/webp"];

export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const contentId = params?.id as string;
  const isCreate = contentId === "new";
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["content", contentId],
    queryFn: () => api.get<GuideContent>(`/dashboard/contents/${contentId}`),
    enabled: Boolean(contentId) && !isCreate
  });

  useEffect(() => {
    if (!data || isCreate) return;
    setForm({
      title: data.title ?? "",
      description: data.description ?? "",
      storeId: data.thriftStoreId ?? "",
      imageUrl: data.imageUrl ?? "",
      categoryLabel: (data as any).categoryLabel ?? "",
      type: (data as any).type ?? ""
    });
  }, [data, isCreate]);

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/dashboard/contents/${contentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      router.replace("/contents");
    }
  });

  const { mutateAsync: createContent, isPending: creating } = useMutation({
    mutationFn: (payload: any) => api.post<GuideContent>(`/contents`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contents"] }),
    onError: () => setErrorMsg("Não foi possível criar o conteúdo.")
  });

  const { mutateAsync: updateContent, isPending: saving } = useMutation({
    mutationFn: (payload: any) => api.put<GuideContent>(`/contents/${contentId}`, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["content", contentId] });
      await qc.invalidateQueries({ queryKey: ["contents"] });
    },
    onError: () => setErrorMsg("Não foi possível salvar o conteúdo.")
  });

  const handleDelete = () => {
    if (!data) return;
    const confirmed = window.confirm("Deseja excluir este conteúdo?");
    if (!confirmed) return;
    deleteMutation.mutate(undefined, {
      onError: () => alert("Não foi possível excluir o conteúdo.")
    });
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setStatus(null);

    const title = form.title.trim();
    const description = form.description.trim();
    const storeId = form.storeId.trim();

    if (!title) return setErrorMsg("Título é obrigatório.");
    if (!description) return setErrorMsg("Descrição é obrigatória.");
    if (!storeId) return setErrorMsg("Loja é obrigatória.");

    try {
      let targetId = contentId;

      if (isCreate) {
        const created = await createContent({
          title,
          description,
          storeId
        });
        targetId = created.id;
        setStatus("Conteúdo criado.");
      }

      let imageUrl = form.imageUrl.trim();
      if (file) {
        setStatus("Solicitando slot de upload...");
        const slot = await api.post<ImageSlot>(`/contents/${targetId}/image/upload`, {
          contentType: file.type || "image/jpeg"
        });
        setStatus("Enviando imagem...");
        const putRes = await fetch(slot.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": slot.contentType },
          body: file
        });
        if (!putRes.ok) throw new Error("Falha ao enviar imagem.");
        imageUrl = slot.fileKey;
        setStatus("Imagem enviada.");
      }

      const payload: Record<string, any> = {};
      const current = data;
      const pushField = (key: keyof ContentForm, val: string, currentVal?: string) => {
        if (val !== undefined && val !== (currentVal ?? "")) payload[key] = val;
      };

      pushField("title", title, current?.title ?? "");
      pushField("description", description, current?.description ?? "");
      pushField("storeId", storeId, current?.thriftStoreId ?? "");
      if (imageUrl && imageUrl !== current?.imageUrl) payload.imageUrl = imageUrl;
      if (form.categoryLabel.trim()) payload.categoryLabel = form.categoryLabel.trim();
      if (form.type.trim()) payload.type = form.type.trim();

      if (Object.keys(payload).length > 0) {
        await updateContent(payload);
        setStatus("Conteúdo atualizado.");
      } else if (!isCreate) {
        setStatus("Nada para salvar.");
      }

      if (isCreate && targetId !== contentId) {
        router.replace(`/contents/${targetId}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Não foi possível salvar. Verifique os campos ou o upload.");
    }
  };

  const imagePreview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    if (form.imageUrl) return form.imageUrl;
    return null;
  }, [file, form.imageUrl]);

  if (!isCreate && isLoading) return <div className="p-4">Carregando...</div>;
  if (!isCreate && (error || !data)) return <div className="p-4 text-red-600">Erro ao carregar conteúdo.</div>;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader
        title={isCreate ? "Novo conteúdo" : data?.title ?? "Conteúdo"}
        subtitle={isCreate ? "Crie um novo conteúdo" : data?.thriftStoreName ?? data?.thriftStoreId}
        actions={
          !isCreate ? (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </button>
          ) : null
        }
      />

      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-white">{isCreate ? "Criar conteúdo" : "Editar conteúdo"}</p>
            <p className="text-sm text-white/70">Título, descrição e loja são obrigatórios.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={creating || saving}
            className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
          >
            {creating || saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        {errorMsg ? <p className="text-sm text-red-300">{errorMsg}</p> : null}
        {status ? <p className="text-sm text-brand-muted">{status}</p> : null}

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput label="Título *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} maxLength={160} />
            <LabeledInput
              label="Loja (storeId) *"
              value={form.storeId}
              onChange={(v) => setForm({ ...form, storeId: v })}
              placeholder="UUID da loja"
              maxLength={64}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LabeledInput
              label="Categoria (opcional)"
              value={form.categoryLabel}
              onChange={(v) => setForm({ ...form, categoryLabel: v })}
              placeholder="general"
              maxLength={160}
            />
            <LabeledInput
              label="Tipo (opcional)"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              placeholder="article"
              maxLength={160}
            />
          </div>

          <div className="space-y-2">
            <span className="text-white/70 text-sm">Imagem (opcional)</span>
            <div className="flex flex-col gap-2">
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Enviar arquivo
                <input
                  type="file"
                  accept={ALLOWED_IMG.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (!ALLOWED_IMG.includes(f.type)) {
                      setErrorMsg("Formatos permitidos: JPEG, PNG ou WEBP.");
                      return;
                    }
                    if (f.size > MAX_IMAGE) {
                      setErrorMsg("Imagem deve ter no máximo 5MB.");
                      return;
                    }
                    setFile(f);
                    setErrorMsg(null);
                  }}
                />
              </label>
              {imagePreview ? (
                <div className="relative h-36 w-48 overflow-hidden rounded-lg border border-white/10 bg-white">
                  <Image src={imagePreview} alt="Prévia" fill className="object-cover" />
                </div>
              ) : null}
            </div>
          </div>

          <LabeledTextArea
            label="Descrição *"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            rows={5}
            maxLength={2000}
          />
        </div>
      </GlassCard>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label ? <span className="text-white/70">{label}</span> : null}
      <input
        value={value}
        type={type}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
  rows = 3
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-white/70">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      />
    </label>
  );
}
