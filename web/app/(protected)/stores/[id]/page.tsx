"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import clsx from "classnames";
import { api } from "@/lib/api";
import type { ThriftStore } from "@/types/index";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { PageHeader } from "@/components/dashboard/PageHeader";

type StoreFormState = {
  name: string;
  tagline: string;
  description: string;
  openingHours: string;
  addressLine: string;
  neighborhood: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  facebook: string;
  website: string;
  categories: string;
  latitude: string;
  longitude: string;
};

type PhotoDraft = {
  localId: string;
  id?: string | number;
  url?: string;
  previewUrl?: string;
  file?: File;
  fileKey?: string;
};

type PhotoUploadSlot = { uploadUrl: string; fileKey: string; contentType: string };

const MAX_PHOTOS = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/webp", "image/jpg", "image/pjpeg", "image/x-webp"];
const MAX_SIZE = 2 * 1024 * 1024;
const ADDRESS_DEBOUNCE_MS = 500;

const emptyFormState: StoreFormState = {
  name: "",
  tagline: "",
  description: "",
  openingHours: "",
  addressLine: "",
  neighborhood: "",
  phone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  facebook: "",
  website: "",
  categories: "",
  latitude: "",
  longitude: ""
};

type AddressSuggestion = {
  id: string;
  label: string;
  placeName: string;
  lat: number;
  lng: number;
  neighborhood?: string;
};

export default function StoreDetailPage() {
  const params = useParams<{ id: string }>();
  const storeId = params?.id as string;
  const isCreate = storeId === "new";
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState<StoreFormState | null>(isCreate ? emptyFormState : null);
  const [showEdit, setShowEdit] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressShouldFetch, setAddressShouldFetch] = useState(false);

  const [photoDrafts, setPhotoDrafts] = useState<PhotoDraft[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<(string | number)[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["store", storeId],
    queryFn: () => api.get<ThriftStore>(`/stores/${storeId}`),
    enabled: Boolean(storeId) && !isCreate
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.del(`/stores/${storeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores"] });
    }
  });

  const {
    mutateAsync: updateStore,
    isPending: isSavingStore
  } = useMutation({
    mutationFn: (payload: any) => api.put<ThriftStore>(`/stores/${storeId}`, payload),
    onSuccess: async () => {
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["store", storeId] });
    },
    onError: () => setFormError("Não foi possível salvar. Verifique os campos e tente novamente.")
  });

  const { mutateAsync: createStore, isPending: isCreatingStore } = useMutation({
    mutationFn: (payload: any) => api.post<ThriftStore>(`/stores`, payload),
    onSuccess: async () => {
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: () => setFormError("Não foi possível salvar. Verifique os campos e tente novamente.")
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      tagline: data.tagline ?? "",
      description: data.description ?? "",
      openingHours: data.openingHours ?? "",
      addressLine: data.addressLine ?? "",
      neighborhood: data.neighborhood ?? "",
      phone: data.phone ?? "",
      whatsapp: data.whatsapp ?? "",
      email: data.email ?? "",
      instagram: data.instagram ?? "",
      facebook: data.facebook ?? "",
      website: data.website ?? "",
      categories: (data.categories ?? []).join(", "),
      latitude: data.latitude != null ? String(data.latitude) : "",
      longitude: data.longitude != null ? String(data.longitude) : ""
    });
    setAddressQuery(data.addressLine ?? "");
    setPhotoDrafts(buildPhotoDrafts(data));
    setDeletedPhotoIds([]);
    setPhotoError(null);
    setPhotoStatus(null);
    setAddressError(null);
    setAddressSuggestions([]);
  }, [data]);

  const mapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;

  useEffect(() => {
    if (!addressShouldFetch) return;
    if (!addressQuery || addressQuery.trim().length < 3) {
      setAddressSuggestions([]);
      setAddressError(null);
      return;
    }
    const handle = setTimeout(async () => {
      if (!mapboxToken) {
        setAddressError("Configure NEXT_PUBLIC_MAPBOX_TOKEN para sugestões de endereço.");
        setAddressSuggestions([]);
        return;
      }
      setAddressLoading(true);
      setAddressError(null);
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          addressQuery
        )}.json?autocomplete=true&limit=5&language=pt&access_token=${mapboxToken}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Geocoding error");
        const json = await res.json();
        const suggestions: AddressSuggestion[] = (json.features ?? []).map((f: any) => ({
          id: f.id,
          label: f.text,
          placeName: f.place_name,
          lat: f.center?.[1],
          lng: f.center?.[0],
          neighborhood: extractNeighborhood(f)
        }));
        setAddressSuggestions(suggestions);
      } catch (err) {
        console.error(err);
        setAddressError("Não foi possível buscar sugestões. Verifique sua conexão ou token do Mapbox.");
      } finally {
        setAddressLoading(false);
      }
    }, ADDRESS_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [addressQuery, addressShouldFetch, mapboxToken]);

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

  if (isCreate) {
    if (!form) return null;
  } else {
    if (isLoading) return <div className="p-4">Carregando...</div>;
    if (error || !data) return <div className="p-4 text-red-600">Erro ao carregar brechó.</div>;
    if (!form) return null;
  }

  const handleSaveBasic = async () => {
    if (!form) return;
    const current = isCreate ? null : data;
    setFormError(null);
    setFormMessage(null);
    setPhotoError(null);
    setPhotoStatus(null);
    setSavingAll(true);

    const payload: Record<string, any> = {};
    let changes = 0;

    const nullable = (value: string) => {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    };

    const safeCompare = (value: any) => (value === null || value === undefined ? null : value);

    const name = form.name.trim();
    if (name === "") {
      setFormError("O nome não pode ficar em branco.");
      return;
    }
    if (name !== (current?.name ?? "")) {
      payload.name = name;
      changes++;
    }

    const addressLine = form.addressLine.trim();
    if (addressLine === "") {
      setFormError("O endereço não pode ficar em branco.");
      return;
    }
    if (addressLine !== (current?.addressLine ?? "")) {
      payload.addressLine = addressLine === "" ? null : addressLine;
      changes++;
    }

    const applyField = (key: keyof StoreFormState, currentVal: any) => {
      const next = nullable(form[key]);
      if (safeCompare(next) !== safeCompare(currentVal)) {
        payload[key] = next;
        changes++;
      }
    };

    applyField("tagline", current?.tagline);
    if (isCreate && form.description.trim() === "") {
      setFormError("A descrição é obrigatória.");
      return;
    }
    applyField("description", current?.description);
    applyField("openingHours", current?.openingHours);
    applyField("neighborhood", current?.neighborhood);
    if (isCreate && form.phone.trim() === "") {
      setFormError("O telefone é obrigatório.");
      return;
    }
    applyField("phone", current?.phone);
    applyField("whatsapp", current?.whatsapp);
    applyField("email", current?.email);
    // social handled separately

    const newCategories = normalizeCategories(form.categories);
    if (newCategories.length > 10) {
      setFormError("Máximo de 10 categorias.");
      return;
    }
    const currentCategories = normalizeCategories((current?.categories ?? []).join(","));
    if (newCategories.join(",") !== currentCategories.join(",")) {
      payload.categories = newCategories;
      changes++;
    }

    const latText = form.latitude.trim();
    const lngText = form.longitude.trim();
    const hasLat = latText !== "";
    const hasLng = lngText !== "";

    const addressChanged = addressLine !== (current?.addressLine ?? "");
    if (addressChanged && (!hasLat || !hasLng)) {
      setFormError("Selecione uma sugestão para preencher latitude e longitude ao alterar o endereço.");
      return;
    }

    if (hasLat !== hasLng) {
      setFormError("Latitude e longitude devem ser enviadas juntas.");
      return;
    }

    if (hasLat && hasLng) {
      const latNum = Number(latText);
      const lngNum = Number(lngText);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        setFormError("Latitude e longitude devem ser números.");
        return;
      }
      if (latNum !== current?.latitude || lngNum !== current?.longitude) {
        payload.latitude = latNum;
        payload.longitude = lngNum;
        changes++;
      }
    } else if (isCreate) {
      setFormError("Latitude e longitude são obrigatórias.");
      return;
    }

    const socialPayload = buildSocialPayload(form, current ?? null);
    if (socialPayload) {
      payload.social = socialPayload;
      // avoid sending deprecated flat fields
      delete payload.facebook;
      delete payload.instagram;
      delete payload.website;
    }

    const baseImages = isCreate ? [] : (data?.images ?? []);
    const photosDirty = arePhotosDirty(photoDrafts, deletedPhotoIds, baseImages);

    if (!photosDirty && changes === 0) {
      setFormMessage("Nada para salvar — nenhuma alteração detectada.");
      setSavingAll(false);
      return;
    }

    try {
      let targetStoreId = storeId;

      if (isCreate) {
        const created = await createStore(payload);
        targetStoreId = created.id;
        setFormMessage("Brechó criado. Salvando fotos...");
      } else if (changes > 0) {
        await updateStore(payload);
      }

      if (photosDirty && targetStoreId) {
        await processPhotosFlow({
          storeId: targetStoreId,
          drafts: photoDrafts,
          deletedPhotoIds,
          setStatus: setPhotoStatus,
          setError: setPhotoError,
          setDrafts: setPhotoDrafts,
          resetDeleted: () => setDeletedPhotoIds([])
        });
        await qc.invalidateQueries({ queryKey: ["store", targetStoreId] });
      }

      if (isCreate && targetStoreId !== storeId) {
        router.replace(`/stores/${targetStoreId}`);
      }

      setFormMessage("Alterações salvas.");
    } catch (err) {
      console.error(err);
      setFormError("Não foi possível salvar. Verifique os campos e tente novamente.");
    } finally {
      setSavingAll(false);
    }
  };

  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    setPhotoError(null);
    const existingCount = photoDrafts.length;
    const incoming = Array.from(files);

    if (existingCount + incoming.length > MAX_PHOTOS) {
      setPhotoError(`Máximo de ${MAX_PHOTOS} fotos. Remova alguma antes de adicionar.`);
      return;
    }

    const nextDrafts: PhotoDraft[] = [];
    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setPhotoError("Formatos permitidos: JPEG ou WEBP.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setPhotoError("Cada arquivo deve ter no máximo 2MB.");
        return;
      }
      const localId = `new-${crypto.randomUUID?.() ?? Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      nextDrafts.push({
        localId,
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    setPhotoDrafts((prev) => [...prev, ...nextDrafts].slice(0, MAX_PHOTOS));
  };

  const movePhoto = (localId: string, direction: -1 | 1) => {
    setPhotoDrafts((prev) => {
      const idx = prev.findIndex((p) => p.localId === localId);
      if (idx < 0) return prev;
      const swapWith = idx + direction;
      if (swapWith < 0 || swapWith >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
      return copy;
    });
  };

  const setAsCover = (localId: string) => {
    setPhotoDrafts((prev) => {
      const idx = prev.findIndex((p) => p.localId === localId);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const removePhoto = (localId: string) => {
    setPhotoDrafts((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (!target) return prev;
      if (target.id) {
        setDeletedPhotoIds((ids) => Array.from(new Set([...ids, target.id!])));
      }
      return prev.filter((p) => p.localId !== localId);
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-4 sm:p-6 lg:p-10 text-textDark">
      <PageHeader
        title={isCreate ? "Novo brechó" : data?.name || "Brechó"}
        subtitle={
          isCreate
            ? "Preencha os dados para criar um novo brechó."
            : data?.tagline || data?.addressLine || "Detalhes do brechó"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isCreate && (
              <button
                onClick={onDelete}
                className="rounded-xl border border-red-500/70 bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-60"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
              </button>
            )}
          </div>
        }
      />

      {showEdit && (
        <>
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Editar informações básicas</p>
                <p className="text-sm text-white/80">
                  Atualize dados do brechó. Nome e endereço não podem ser vazios.
                </p>
              </div>
              <button
                onClick={handleSaveBasic}
                disabled={isSavingStore || isCreatingStore || savingAll}
                className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-forest transition hover:scale-[1.01] hover:bg-white disabled:opacity-60"
              >
                {savingAll || isSavingStore || isCreatingStore ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {formMessage ? <p className="text-sm text-white/80">{formMessage}</p> : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <LabeledInput label="Nome *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} maxLength={120} />
              <LabeledInput
                label="Tagline"
                value={form.tagline}
                onChange={(v) => setForm({ ...form, tagline: v })}
                placeholder="Frase curta"
                maxLength={280}
              />
              <LabeledTextArea
                label="Descrição"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
                rows={4}
                maxLength={2000}
              />
              <LabeledInput
                label="Horário de funcionamento"
                value={form.openingHours}
                onChange={(v) => setForm({ ...form, openingHours: v })}
                placeholder="Ex: Seg-Sáb 10h-18h"
                maxLength={256}
              />
              <div className="relative">
                <LabeledInput
                  label="Endereço *"
                  value={form.addressLine}
                  onChange={(v) => {
                    setAddressShouldFetch(true);
                    setAddressQuery(v);
                    setForm({
                      ...form,
                      addressLine: v,
                      neighborhood: "",
                      latitude: "",
                      longitude: ""
                    });
                  }}
                  placeholder="Rua, número, cidade"
                  maxLength={512}
                />
                <AddressSuggestions
                  loading={addressLoading}
                  error={addressError}
                  suggestions={addressSuggestions}
                  onSelect={(s) => {
                    setForm({
                      ...form,
                      addressLine: s.placeName,
                      neighborhood: s.neighborhood ?? "",
                      latitude: s.lat != null ? String(s.lat) : "",
                      longitude: s.lng != null ? String(s.lng) : ""
                    });
                    setAddressSuggestions([]);
                    setAddressError(null);
                    setFormMessage("Endereço atualizado a partir da sugestão.");
                    setAddressShouldFetch(false);
                    setAddressQuery("");
                  }}
                />
              </div>
              <LabeledInput label="Bairro" value={form.neighborhood} readOnly disabled maxLength={120} />
              <LabeledInput label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} maxLength={32} />
              <LabeledInput
                label="Whatsapp"
                value={form.whatsapp}
                onChange={(v) => setForm({ ...form, whatsapp: v })}
                maxLength={32}
              />
              <LabeledInput label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} maxLength={320} />
              <LabeledInput
                label="Instagram"
                value={form.instagram}
                onChange={(v) => setForm({ ...form, instagram: v })}
                placeholder="@usuario"
                maxLength={320}
              />
              <LabeledInput
                label="Facebook"
                value={form.facebook}
                onChange={(v) => setForm({ ...form, facebook: v })}
                maxLength={320}
              />
              <LabeledInput
                label="Website"
                value={form.website}
                onChange={(v) => setForm({ ...form, website: v })}
                placeholder="https://"
                maxLength={320}
              />
              <LabeledInput
                label="Categorias (separadas por vírgula)"
                value={form.categories}
                onChange={(v) => setForm({ ...form, categories: v })}
                placeholder="vintage, jeans, acessórios"
                maxLength={512}
              />
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="Latitude"
                  value={form.latitude}
                  placeholder="-23.55"
                  readOnly
                  disabled
                />
                <LabeledInput
                  label="Longitude"
                  value={form.longitude}
                  placeholder="-46.63"
                  readOnly
                  disabled
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">Fotos</p>
                <p className="text-sm text-white/80">Máximo 10 fotos. JPEG ou WEBP até 2MB.</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-textDark hover:bg-white/70">
                Adicionar fotos
                <input
                  type="file"
                  accept={ALLOWED_TYPES.join(",")}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleAddPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {photoError ? <p className="text-sm text-red-300">{photoError}</p> : null}
            {photoStatus ? <p className="text-sm text-brand-muted">{photoStatus}</p> : null}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {photoDrafts.map((photo, index) => (
                <div key={photo.localId} className="group relative overflow-hidden rounded-xl border border-black/10">
                  {photo.url ? (
                    <Image src={photo.url} alt={`Foto ${index + 1}`} width={400} height={300} className="h-32 w-full object-cover" />
                  ) : (
                    <img src={photo.previewUrl} alt={`Pré-visualização ${index + 1}`} className="h-32 w-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-between bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1 px-2 pt-2">
                      <Chip active={index === 0}>Capa</Chip>
                      <button
                        type="button"
                        onClick={() => setAsCover(photo.localId)}
                        className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
                        disabled={index === 0}
                      >
                        Definir capa
                      </button>
                    </div>
                    <div className="flex justify-between gap-1 px-2 pb-2">
                      <button
                        type="button"
                        onClick={() => movePhoto(photo.localId, -1)}
                        disabled={index === 0}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(photo.localId, 1)}
                        disabled={index === photoDrafts.length - 1}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.localId)}
                        className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/30"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                      Capa
                    </span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}

function buildPhotoDrafts(store: ThriftStore): PhotoDraft[] {
  const imgs = (store.images ?? []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const coverIndex = imgs.findIndex((i) => i.isCover);
  if (coverIndex > 0) {
    const [cover] = imgs.splice(coverIndex, 1);
    imgs.unshift(cover);
  }
  return imgs.map((img) => ({
    localId: `existing-${img.id}`,
    id: img.id,
    url: img.url,
    fileKey: undefined
  }));
}

function normalizeCategories(raw: string) {
  return raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function extractNeighborhood(feature: any): string | undefined {
  if (!feature?.context) return undefined;
  const ctx = feature.context as Array<{ id: string; text: string }>;
  const neighborhood = ctx.find((c) => c.id?.startsWith("neighborhood"));
  const place = ctx.find((c) => c.id?.startsWith("place"));
  return neighborhood?.text || place?.text;
}

function buildSocialPayload(form: StoreFormState, current: ThriftStore | null) {
  const social = {
    facebook: form.facebook.trim() || null,
    instagram: form.instagram.trim() || null,
    website: form.website.trim() || null
  };
  const existing = {
    facebook: current?.facebook ?? null,
    instagram: current?.instagram ?? null,
    website: current?.website ?? null
  };

  const changed =
    social.facebook !== existing.facebook || social.instagram !== existing.instagram || social.website !== existing.website;
  if (!changed) return null;
  return social;
}

function arePhotosDirty(drafts: PhotoDraft[], deleted: (string | number)[], baseImages: ThriftStore["images"]): boolean {
  if (deleted.length > 0) return true;
  if (drafts.some((d) => d.file)) return true;
  const base = (baseImages ?? [])
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((i) => i.id);
  const current = drafts.filter((d) => d.id).map((d) => d.id as string | number);
  if (base.length !== current.length) return true;
  for (let i = 0; i < base.length; i++) {
    if (base[i] !== current[i]) return true;
  }
  return false;
}

async function processPhotosFlow({
  storeId,
  drafts,
  deletedPhotoIds,
  setStatus,
  setError,
  setDrafts,
  resetDeleted
}: {
  storeId: string;
  drafts: PhotoDraft[];
  deletedPhotoIds: (string | number)[];
  setStatus: (v: string | null) => void;
  setError: (v: string | null) => void;
  setDrafts: (d: PhotoDraft[]) => void;
  resetDeleted: () => void;
}) {
  setError(null);
  const uniqueDeletes = Array.from(new Set(deletedPhotoIds));
  const draftsCopy = drafts.map((p) => ({ ...p }));
  const pending = draftsCopy.filter((d) => d.file && !d.fileKey);

  if (pending.length > 0) {
    setStatus("Solicitando URLs de upload...");
    const uploadRes = await api.post<{ uploads: PhotoUploadSlot[] }>(`/stores/${storeId}/photos/uploads`, {
      count: pending.length,
      contentTypes: pending.map((p) => p.file?.type || "image/jpeg")
    });

    const slots = uploadRes.uploads ?? [];
    if (slots.length !== pending.length) throw new Error("Resposta inesperada ao solicitar uploads.");

    setStatus("Enviando arquivos...");
    await Promise.all(
      pending.map((draft, idx) => {
        const slot = slots[idx];
        draft.fileKey = slot.fileKey;
        return fetch(slot.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": slot.contentType },
          body: draft.file!
        }).then((res) => {
          if (!res.ok) throw new Error("Falha ao enviar arquivo de imagem.");
        });
      })
    );
  }

  const photosPayload = draftsCopy.map((draft, index) => {
    if (!draft.id && !draft.fileKey) {
      throw new Error("Arquivo novo sem fileKey. Tente novamente.");
    }
    return {
      position: index,
      ...(draft.id ? { photoId: draft.id } : {}),
      ...(draft.fileKey ? { fileKey: draft.fileKey } : {})
    };
  });

  setStatus("Registrando ordem e capa...");
  const updated = await api.put<ThriftStore>(`/stores/${storeId}/photos`, {
    photos: photosPayload,
    deletePhotoIds: uniqueDeletes.length ? uniqueDeletes : undefined
  });

  setDrafts(buildPhotoDrafts(updated));
  resetDeleted();
  setStatus("Fotos atualizadas.");
}

function AddressSuggestions({
  loading,
  error,
  suggestions,
  onSelect
}: {
  loading: boolean;
  error: string | null;
  suggestions: AddressSuggestion[];
  onSelect: (s: AddressSuggestion) => void;
}) {
  if (error) {
    return <p className="mt-1 text-xs text-red-300">{error}</p>;
  }
  if (!loading && suggestions.length === 0) return null;
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
      {loading ? (
        <p className="px-3 py-2 text-xs text-textSubtle">Buscando sugestões...</p>
      ) : (
        suggestions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-textDark hover:bg-black/5"
          >
            <span className="font-semibold">{s.label}</span>
            <span className="text-xs text-textSubtle">{s.placeName}</span>
            {s.neighborhood ? <span className="text-[11px] text-textSubtle">Bairro: {s.neighborhood}</span> : null}
          </button>
        ))
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  maxLength
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-white/70">{label}</span>
      <input
        value={value}
        maxLength={maxLength}
        onChange={(e) => (disabled || readOnly || !onChange ? undefined : onChange(e.target.value))}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        className={clsx(
          "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40",
          disabled || readOnly ? "cursor-not-allowed opacity-70 focus:ring-0" : ""
        )}
      />
    </label>
  );
}

function LabeledTextArea({
  label,
  value,
  onChange,
  rows = 3,
  maxLength
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-white/70">{label}</span>
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      />
    </label>
  );
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
        active ? "bg-brand-primary text-brand-forest" : "bg-white/10 text-white"
      )}
    >
      {children}
    </span>
  );
}
