import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";
import type { ThriftStoreRemoteDataSource } from "../ThriftStoreRemoteDataSource";
import { api } from "../../../api/client";

export class HttpThriftStoreRemoteDataSource implements ThriftStoreRemoteDataSource {
  async getFeatured(params?: { lat?: number; lng?: number; forceRefresh?: boolean }): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/featured", {
      params: { lat: params?.lat, lng: params?.lng }
    });
    return res.data;
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
    return res.data;
  }

  async getFavorites(): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/stores/favorites");
    return res.data;
  }

  async getById(id: ThriftStoreId): Promise<ThriftStore | null> {
    const res = await api.get<ThriftStore | null>(`/stores/${id}`);
    return res.data;
  }

  async search(query: string): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/stores", { params: { q: query } });
    return res.data;
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
    return res.data;
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
    return res.data;
  }

  async createStore(form: FormData): Promise<ThriftStore> {
    const res = await api.post<ThriftStore>("/stores", form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }

  async updateStore(id: ThriftStoreId, form: FormData): Promise<ThriftStore> {
    const res = await api.put<ThriftStore>(`/stores/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
}
