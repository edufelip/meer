import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";

export interface ThriftStoreRemoteDataSource {
  getFeatured(): Promise<ThriftStore[]>;
  getNearby(): Promise<ThriftStore[]>;
  getFavorites(): Promise<ThriftStore[]>;
  getById(id: ThriftStoreId): Promise<ThriftStore | null>;
  search(query: string): Promise<ThriftStore[]>;
  listByCategory(params: { categoryId: string; page?: number; pageSize?: number }): Promise<{
    items: ThriftStore[];
    page: number;
    hasNext: boolean;
  }>;
}
