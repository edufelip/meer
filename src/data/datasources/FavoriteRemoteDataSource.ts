import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";

export interface FavoriteRemoteDataSource {
  list(): Promise<ThriftStore[]>;
  add(storeId: ThriftStoreId): Promise<void>;
  remove(storeId: ThriftStoreId): Promise<void>;
}
