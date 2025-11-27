import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";

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

  createStore(form: FormData): Promise<ThriftStore>;
  updateStore(id: ThriftStoreId, form: FormData): Promise<ThriftStore>;
}
