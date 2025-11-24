import { api } from "../../../api/client";
import type { FavoriteRemoteDataSource } from "../FavoriteRemoteDataSource";
import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";

export class HttpFavoriteRemoteDataSource implements FavoriteRemoteDataSource {
  async list(): Promise<ThriftStore[]> {
    const res = await api.get<ThriftStore[]>("/favorites");
    return res.data;
  }

  async add(storeId: ThriftStoreId): Promise<void> {
    await api.post(`/favorites/${storeId}`);
  }

  async remove(storeId: ThriftStoreId): Promise<void> {
    await api.delete(`/favorites/${storeId}`);
  }
}
