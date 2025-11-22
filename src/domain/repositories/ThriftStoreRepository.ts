import type { ThriftStore } from "../entities/ThriftStore";

export interface ThriftStoreRepository {
  getFeatured(): Promise<ThriftStore[]>;
  getNearby(): Promise<ThriftStore[]>;
  getFavorites(): Promise<ThriftStore[]>;
  getById(id: ThriftStoreId): Promise<ThriftStore | null>;
  search(query: string): Promise<ThriftStore[]>;
}
