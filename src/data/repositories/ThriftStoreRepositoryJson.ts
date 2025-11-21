import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";
import type { ThriftStoreRepository } from "../../domain/repositories/ThriftStoreRepository";
import type { ThriftStoreRemoteDataSource } from "../datasources/ThriftStoreRemoteDataSource";

export class ThriftStoreRepositoryJson implements ThriftStoreRepository {
  private readonly remote: ThriftStoreRemoteDataSource;

  constructor(remote: ThriftStoreRemoteDataSource) {
    this.remote = remote;
  }

  getFeatured(): Promise<ThriftStore[]> {
    return this.remote.getFeatured();
  }

  getNearby(): Promise<ThriftStore[]> {
    return this.remote.getNearby();
  }

  getFavorites(): Promise<ThriftStore[]> {
    return this.remote.getFavorites();
  }

  getById(id: ThriftStoreId): Promise<ThriftStore | null> {
    return this.remote.getById(id);
  }
}
