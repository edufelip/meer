import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";
import type { ThriftStoreRepository } from "../../domain/repositories/ThriftStoreRepository";
import type { ThriftStoreRemoteDataSource } from "../datasources/ThriftStoreRemoteDataSource";
import type { FeaturedLocalDataSource } from "../datasources/FeaturedLocalDataSource";

export class ThriftStoreRepositoryJson implements ThriftStoreRepository {
  private readonly remote: ThriftStoreRemoteDataSource;
  private readonly featuredLocal?: FeaturedLocalDataSource;
  private readonly memoryCache = new Map<
    string,
    { data: ThriftStore[]; fetchedAt: number }
  >();
  private readonly inflight = new Map<string, Promise<ThriftStore[]>>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24h strict

  constructor(remote: ThriftStoreRemoteDataSource, featuredLocal?: FeaturedLocalDataSource) {
    this.remote = remote;
    this.featuredLocal = featuredLocal;
  }

  private bucketKey(params?: { lat?: number; lng?: number }) {
    if (params?.lat != null && params?.lng != null) {
      const r = (v: number) => Math.round(v * 100) / 100; // 2 decimal bucket
      return `loc_${r(params.lat)}_${r(params.lng)}`;
    }
    return "global";
  }

  private async fetchRemote(
    bucket: string,
    params?: { lat?: number; lng?: number }
  ): Promise<ThriftStore[]> {
    const inflight = this.inflight.get(bucket);
    if (inflight) return inflight;
    const p = this.remote
      .getFeatured(params)
      .then((data) => {
        const entry = { data: data ?? [], fetchedAt: Date.now() };
        this.memoryCache.set(bucket, entry);
        void this.featuredLocal?.saveFeatured(bucket, entry);
        return entry.data;
      })
      .finally(() => {
        this.inflight.delete(bucket);
      });
    this.inflight.set(bucket, p);
    return p;
  }

  async getFeatured(params?: {
    lat?: number;
    lng?: number;
    forceRefresh?: boolean;
    onUpdated?: (data: ThriftStore[]) => void;
  }): Promise<ThriftStore[]> {
    const bucket = this.bucketKey(params);
    const now = Date.now();

    if (params?.forceRefresh) {
      return this.fetchRemote(bucket, params);
    }

    const mem = this.memoryCache.get(bucket);
    if (mem) {
      if (now - mem.fetchedAt < this.TTL) {
        return mem.data;
      }
    }

    const local = this.featuredLocal ? await this.featuredLocal.getFeatured(bucket) : null;
    const cached = mem ?? local ?? null;
    const isFresh = cached ? now - cached.fetchedAt < this.TTL : false;

    if (cached) {
      // keep memory in sync
      if (!mem) this.memoryCache.set(bucket, cached);
      if (!isFresh) {
        // stale -> fire background refresh but return cached immediately
        void this.fetchRemote(bucket, params).then((fresh) => {
          if (params?.onUpdated && fresh && JSON.stringify(fresh) !== JSON.stringify(cached.data)) {
            params.onUpdated(fresh);
          }
        });
      }
      return cached.data;
    }

    // no cache
    const fresh = await this.fetchRemote(bucket, params);
    return fresh;
  }

  getNearby(params?: {
    lat?: number;
    lng?: number;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    return this.remote.getNearby(params);
  }

  getFavorites(): Promise<ThriftStore[]> {
    return this.remote.getFavorites();
  }

  getById(id: ThriftStoreId): Promise<ThriftStore | null> {
    return this.remote.getById(id);
  }

  search(query: string): Promise<ThriftStore[]> {
    return this.remote.search(query);
  }

  listByCategory(params: {
    categoryId: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    return this.remote.listByCategory(params);
  }

  listNearbyPaginated(params: {
    page?: number;
    pageSize?: number;
    lat?: number;
    lng?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    return this.remote.listNearbyPaginated(params);
  }

  createStore(form: FormData): Promise<ThriftStore> {
    return this.remote.createStore(form);
  }

  updateStore(id: ThriftStoreId, form: FormData): Promise<ThriftStore> {
    return this.remote.updateStore(id, form);
  }
}
