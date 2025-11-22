import type { ThriftStore, ThriftStoreId } from "../../../domain/entities/ThriftStore";
import type { ThriftStoreRemoteDataSource } from "../ThriftStoreRemoteDataSource";
import thriftStores from "../../../data/mocks/thriftStores.json";
import { loadFromJson } from "./LocalJsonClient";

type ThriftStoresResponse = {
  feature: ThriftStore[];
  nearby: ThriftStore[];
  favorites?: ThriftStore[];
};

export class JsonThriftStoreRemoteDataSource implements ThriftStoreRemoteDataSource {
  async getFeatured(): Promise<ThriftStore[]> {
    return loadFromJson<ThriftStore[]>((thriftStores as ThriftStoresResponse).feature);
  }

  async getNearby(): Promise<ThriftStore[]> {
    return loadFromJson<ThriftStore[]>((thriftStores as ThriftStoresResponse).nearby);
  }

  async getFavorites(): Promise<ThriftStore[]> {
    return loadFromJson<ThriftStore[]>((thriftStores as ThriftStoresResponse).favorites);
  }

  async getById(id: ThriftStoreId): Promise<ThriftStore | null> {
    const all = (thriftStores as ThriftStoresResponse);
    const match = [...all.feature, ...all.nearby, ...(all.favorites ?? [])].find((s) => s.id === id);
    return loadFromJson<ThriftStore | null>(match ?? null);
  }

  async search(query: string): Promise<ThriftStore[]> {
    const all = thriftStores as ThriftStoresResponse;
    const haystack = [...all.feature, ...all.nearby, ...(all.favorites ?? [])];
    const term = query.trim().toLowerCase();
    if (!term) return loadFromJson<ThriftStore[]>(haystack);
    const filtered = haystack.filter((s) =>
      [s.name, s.tagline, s.description, s.neighborhood, s.addressLine]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    );
    return loadFromJson<ThriftStore[]>(filtered);
  }
}
