import {
  ThriftStoreBadge,
  getBadgeLabel,
  type ThriftStore,
  type ThriftStoreId
} from "../../../domain/entities/ThriftStore";
import type {
  CreateStorePayload,
  PhotoUploadSlot,
  ThriftStoreRemoteDataSource
} from "../ThriftStoreRemoteDataSource";
import { api } from "../../../api/client";

export class HttpThriftStoreRemoteDataSource implements ThriftStoreRemoteDataSource {
  async getFeatured(params?: { lat?: number; lng?: number; forceRefresh?: boolean }): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/featured", {
      params: { lat: params?.lat, lng: params?.lng }
    });
    return mapStores(res.data);
  }

  async getNearby(params?: {
    lat?: number;
    lng?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    const pageIndex = (params?.page ?? 1) - 1;
    const res = await api.get<{ items: ThriftStore[]; page: number; hasNext: boolean }>("/nearby", {
      params: {
        lat: params?.lat,
        lng: params?.lng,
        pageIndex: pageIndex < 0 ? 0 : pageIndex,
        pageSize: params?.pageSize ?? 10
      }
    });
    return { ...res.data, items: mapStores(res.data.items) };
  }

  async getFavorites(): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/stores/favorites");
    return mapStores(res.data);
  }

  async getById(id: ThriftStoreId): Promise<ThriftStore | null> {
    const res = await api.get<ThriftStore | null>(`/stores/${id}`);
    return res.data ? mapStore(res.data) : null;
  }

  async search(query: string): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/stores", { params: { q: query } });
    return mapStores(res.data);
  }

  async listByCategory(params: {
    categoryId: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    const res = await api.get<{ items: ThriftStore[]; page: number; hasNext: boolean }>("/stores", {
      params: {
        categoryId: params.categoryId,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10
      }
    });
    return { ...res.data, items: mapStores(res.data.items) };
  }

  async listNearbyPaginated(params: {
    page?: number;
    pageSize?: number;
    lat?: number;
    lng?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    const pageIndex = (params.page ?? 1) - 1;
    const res = await api.get<{ items: ThriftStore[]; page: number; hasNext: boolean }>("/nearby", {
      params: {
        pageIndex: pageIndex < 0 ? 0 : pageIndex,
        pageSize: params.pageSize ?? 10,
        lat: params.lat,
        lng: params.lng
      }
    });
    return { ...res.data, items: mapStores(res.data.items) };
  }

  async createStore(payload: CreateStorePayload): Promise<ThriftStore> {
    const res = await api.post<ThriftStore>("/stores", payload);
    return mapStore(res.data);
  }

  async updateStore(id: ThriftStoreId, payload: Partial<CreateStorePayload>): Promise<ThriftStore> {
    const res = await api.put<ThriftStore>(`/stores/${id}`, payload);
    return mapStore(res.data);
  }

  async requestPhotoUploads(
    storeId: ThriftStoreId,
    body: { count: number; contentTypes: string[] }
  ): Promise<PhotoUploadSlot[]> {
    const res = await api.post<{ uploads: PhotoUploadSlot[] }>(`/stores/${storeId}/photos/uploads`, body);
    return res.data.uploads ?? [];
  }

  async confirmPhotos(
    storeId: ThriftStoreId,
    photos: { fileKey?: string; photoId?: string; position: number }[],
    deletePhotoIds?: string[]
  ): Promise<ThriftStore> {
    const res = await api.put<ThriftStore>(`/stores/${storeId}/photos`, { photos, deletePhotoIds });
    return mapStore(res.data);
  }
}

function mapStore(
  store: ThriftStore & {
    badge_label?: string;
    badgeLabel?: string;
    badge?: ThriftStoreBadge;
    my_rating?: number | null;
  }
): ThriftStore {
  const rawBadgeKey =
    store.badge_label ?? store.badgeLabel ?? (store.badge as string | undefined);
  const normalizedBadge = normalizeBadgeKey(rawBadgeKey);
  const badgeLabel = getBadgeLabel(normalizedBadge) ?? humanizeBadgeKey(rawBadgeKey);
  const myRating = Object.prototype.hasOwnProperty.call(store as any, "myRating")
    ? (store as any).myRating
    : Object.prototype.hasOwnProperty.call(store as any, "my_rating")
      ? (store as any).my_rating
      : undefined;

  return {
    ...store,
    myRating,
    badge: normalizedBadge ?? (rawBadgeKey as ThriftStoreBadge | undefined),
    badgeLabel
  };
}

function mapStores(stores: ThriftStore[]): ThriftStore[] {
  return stores.map((s) => mapStore(s));
}

function normalizeBadgeKey(raw?: string | null): ThriftStoreBadge | undefined {
  if (!raw) return undefined;
  const value = raw.toLowerCase();

  switch (value) {
    case ThriftStoreBadge.MostLoved:
      return ThriftStoreBadge.MostLoved;
    default:
      return raw as ThriftStoreBadge;
  }
}

function humanizeBadgeKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  return raw
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
