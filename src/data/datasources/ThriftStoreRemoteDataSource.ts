import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";

export type CreateStorePayload = {
  name: string;
  addressLine: string;
  description: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
  neighborhood?: string;
  email?: string;
  social?: { instagram?: string };
  categories?: string[];
  coverImageUrl?: string;
  galleryUrls?: string[];
};

export type PhotoUploadSlot = { uploadUrl: string; fileKey: string; contentType: string };

export interface ThriftStoreRemoteDataSource {
  getFeatured(params?: { lat?: number; lng?: number; forceRefresh?: boolean }): Promise<ThriftStore[]>;
  getNearby(params?: {
    lat?: number;
    lng?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }>;
  getFavorites(): Promise<ThriftStore[]>;
  getById(id: ThriftStoreId): Promise<ThriftStore | null>;
  search(query: string): Promise<ThriftStore[]>;
  listByCategory(params: { categoryId: string; page?: number; pageSize?: number }): Promise<{
    items: ThriftStore[];
    page: number;
    hasNext: boolean;
  }>;
  listNearbyPaginated(params: { page?: number; pageSize?: number; lat?: number; lng?: number }): Promise<{
    items: ThriftStore[];
    page: number;
    hasNext: boolean;
  }>;

  createStore(payload: CreateStorePayload): Promise<ThriftStore>;
  updateStore(id: ThriftStoreId, payload: Partial<CreateStorePayload>): Promise<ThriftStore>;
  requestPhotoUploads(storeId: ThriftStoreId, body: { count: number; contentTypes: string[] }): Promise<PhotoUploadSlot[]>;
  confirmPhotos(
    storeId: ThriftStoreId,
    photos: { fileKey?: string; photoId?: string; position: number }[],
    deletePhotoIds?: string[]
  ): Promise<ThriftStore>;
}
