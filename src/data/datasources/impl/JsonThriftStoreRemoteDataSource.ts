import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";
import type { ThriftStoreRemoteDataSource } from "../ThriftStoreRemoteDataSource";
import thriftStores from "../../../data/mocks/thriftStores.json";
import { loadFromJson } from "./LocalJsonClient";

type ThriftStoresResponse = {
  featured: ThriftStore[];
  nearby: ThriftStore[];
  favorites: ThriftStore[];
};

export class JsonThriftStoreRemoteDataSource implements ThriftStoreRemoteDataSource {
  async getFeatured(): Promise<ThriftStore[]> {
    return loadFromJson<ThriftStore[]>((thriftStores as ThriftStoresResponse).featured);
  }

  async getNearby(): Promise<ThriftStore[]> {
    return loadFromJson<ThriftStore[]>((thriftStores as ThriftStoresResponse).nearby);
  }

  async getFavorites(): Promise<ThriftStore[]> {
    return loadFromJson<ThriftStore[]>((thriftStores as ThriftStoresResponse).favorites);
  }

  async getById(id: ThriftStoreId): Promise<ThriftStore | null> {
    const all = (thriftStores as ThriftStoresResponse);
    const match = [...all.featured, ...all.nearby, ...all.favorites].find((s) => s.id === id);
    return loadFromJson<ThriftStore | null>(match ?? null);
  }
}
