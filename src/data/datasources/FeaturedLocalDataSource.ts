import type { ThriftStore } from "../../domain/entities/ThriftStore";

export type FeaturedCacheEntry = {
  data: ThriftStore[];
  fetchedAt: number;
};

export interface FeaturedLocalDataSource {
  getFeatured(bucketKey: string): Promise<FeaturedCacheEntry | null>;
  saveFeatured(bucketKey: string, entry: FeaturedCacheEntry): Promise<void>;
  clearFeatured?(bucketKey: string): Promise<void>;
}
