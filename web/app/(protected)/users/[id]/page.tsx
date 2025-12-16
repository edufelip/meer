"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import clsx from "classnames";
import { api } from "@/lib/api";
import type { User } from "@/types/index";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/dashboard/Pill";

type UserFormState = {
  name: string;
  email: string;
  password: string;
  bio: string;
  avatarUrl: string;
  notifyNewStores: boolean;
  notifyPromos: boolean;
};

type AvatarSlot = { uploadUrl: string; fileKey: string; contentType: string };

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  bio: "",
  avatarUrl: "",
  notifyNewStores: false,
  notifyPromos: false
};

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id as string;
  const isCreate = userId === "new";
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => api.get<User>(`/dashboard/users/${userId}`),
    enabled: Boolean(userId) && !isCreate
  });

  const { data: authMe } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/auth/me"),
    staleTime: 60_000
  });

  const canEditThisUser = isCreate || (authMe && data && authMe.id === data.id);

  useEffect(() => {
    if (!data || isCreate) return;
    setForm({
      name: data.name ?? "",
      email: data.email ?? "",
      password: "",
      bio: data.bio ?? "",
      avatarUrl: data.avatarUrl ?? "",
      notifyNewStores: Boolean(data.notifyNewStores),
      notifyPromos: Boolean(data.notifyPromos)
    });
  }, [data, isCreate]);

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/dashboard/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      router.replace("/users");
    }
  });

  const { mutateAsync: signup, isPending: creating } = useMutation({
    mutationFn: (payload: any) => api.post<{ user: User }>(`/auth/signup`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: () => setFormError("Não foi possível criar o usuário. Verifique os dados.")
  });

  const { mutateAsync: patchProfile, isPending: saving } = useMutation({
    mutationFn: (payload: any) => api.patch<User>(`/profile`, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["user", userId] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => setFormError("Não foi possível salvar. Verifique os campos.")
  });

  const handleDelete = () => {
    if (!data) return;
    const confirmed = window.confirm("Deseja excluir este usuário?");
    if (!confirmed) return;
    deleteMutation.mutate(undefined, {
      onError: () => alert("Não foi possível excluir o usuário.")
    });
  };

  const handleSave = async () => {
    setFormError(null);
    setFormMessage(null);
    setAvatarError(null);
    setAvatarStatus(null);

    if (isCreate) {
      if (!form.name.trim()) return setFormError("Nome é obrigatório.");
      if (!form.email.trim()) return setFormError("Email é obrigatório.");
      if (!form.password.trim()) return setFormError("Senha é obrigatória.");
    } else if (!canEditThisUser) {
      setFormError("Você só pode editar seu próprio perfil.");
      return;
    }

    try {
      let avatarKey = form.avatarUrl.trim() || undefined;
      if (avatarFile) {
        const contentType = avatarFile.type || "image/jpeg";
        setAvatarStatus("Solicitando upload...");
        const slot = await api.post<AvatarSlot>("/profile/avatar/upload", { contentType });
        setAvatarStatus("Enviando avatar...");
        const putRes = await fetch(slot.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": slot.contentType },
          body: avatarFile
        });
        if (!putRes.ok) throw new Error("Falha ao enviar avatar.");
        avatarKey = slot.fileKey;
        setAvatarStatus("Avatar enviado.");
      }

      if (isCreate) {
        const created = await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password
        });
        const newId = created.user.id;
        setFormMessage("Usuário criado.");
        router.replace(`/users/${newId}`);
        return;
      }

      const payload: Record<string, any> = {};
      const nullable = (v: string) => (v.trim() === "" ? null : v.trim());
      const current = data!;

      if (form.name.trim() && form.name.trim() !== current.name) payload.name = form.name.trim();
      if (form.bio.trim() !== (current.bio ?? "")) payload.bio = nullable(form.bio) ?? "";
      if (typeof form.notifyNewStores === "boolean" && form.notifyNewStores !== current.notifyNewStores)
        payload.notifyNewStores = form.notifyNewStores;
      if (typeof form.notifyPromos === "boolean" && form.notifyPromos !== current.notifyPromos)
        payload.notifyPromos = form.notifyPromos;
      if (avatarKey && avatarKey !== current.avatarUrl) payload.avatarUrl = avatarKey;

      if (Object.keys(payload).length === 0) {
        setFormMessage("Nada para salvar.");
        return;
      }

      await patchProfile(payload);
      setFormMessage("Alterações salvas.");
    } catch (err) {
      console.error(err);
      setFormError("Não foi possível salvar. Verifique os campos ou o arquivo de avatar.");
    }
  };

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (form.avatarUrl) return form.avatarUrl;
    return null;
  }, [avatarFile, form.avatarUrl]);

  if (!isCreate && isLoading) return <div className="p-4">Carregando...</div>;
  if (!isCreate && (error || !data)) return <div className="p-4 text-red-600">Erro ao carregar usuário.</div>;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-white">
      <PageHeader
        title={isCreate ? "Novo usuário" : data?.name ?? "Usuário"}
        subtitle={isCreate ? "Cadastre um novo usuário" : data?.email}
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

      {showEdit && (
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{isCreate ? "Criar usuário" : "Editar usuário"}</p>
              <p className="text-sm text-white/70">
                {isCreate ? "Preencha todos os campos obrigatórios." : "Atualize seu perfil."}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={creating || saving}
              className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
            >
              {creating || saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>

          {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
          {formMessage ? <p className="text-sm text-brand-muted">{formMessage}</p> : null}
          {avatarError ? <p className="text-sm text-red-300">{avatarError}</p> : null}
          {avatarStatus ? <p className="text-sm text-brand-muted">{avatarStatus}</p> : null}

          <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
            <LabeledInput label="Nome *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <LabeledInput
              label="Email *"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              disabled={!isCreate}
            />
            {isCreate && (
              <LabeledInput
                label="Senha *"
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
              />
            )}
            <LabeledTextArea
              label="Bio (max 200)"
              value={form.bio}
              onChange={(v) => setForm({ ...form, bio: v.slice(0, 200) })}
              rows={3}
            />

            <div className="space-y-2">
              <span className="text-white/70 text-sm mb-1 block">Avatar</span>
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
                Enviar arquivo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      setAvatarError("Máximo 5MB.");
                      return;
                    }
                    setAvatarError(null);
                    setAvatarFile(file);
                  }}
                />
              </label>
              {avatarPreview ? (
                <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/10">
                  <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                </div>
              ) : null}
            </div>
          </div>
        </GlassCard>
      )}

      {!isCreate && data && (
        <GlassCard className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Pill>ID {data.id}</Pill>
            {data.role ? <Pill className="bg-brand-primary/20 text-brand-primary">{data.role}</Pill> : null}
            {data.notifyNewStores ? <Pill>Notificar novos brechós</Pill> : null}
            {data.notifyPromos ? <Pill>Notificar promoções</Pill> : null}
          </div>

          {data.ownedThriftStore && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Brechó do usuário</p>
              <Link href={`/stores/${data.ownedThriftStore.id}`} className="text-brand-primary hover:underline">
                {data.ownedThriftStore.name}
              </Link>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label ? <span className="text-white/70">{label}</span> : null}
      <input
        value={value}
        type={type}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40",
          disabled ? "cursor-not-allowed opacity-70 focus:ring-0" : ""
        )}
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return null;
}
