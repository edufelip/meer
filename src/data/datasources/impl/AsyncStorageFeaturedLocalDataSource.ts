import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FeaturedCacheEntry, FeaturedLocalDataSource } from "../FeaturedLocalDataSource";

const PREFIX = "featured-cache";

const keyFor = (bucket: string) => `${PREFIX}:${bucket}`;

export class AsyncStorageFeaturedLocalDataSource implements FeaturedLocalDataSource {
  async getFeatured(bucketKey: string): Promise<FeaturedCacheEntry | null> {
    const raw = await AsyncStorage.getItem(keyFor(bucketKey));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as FeaturedCacheEntry;
    } catch {
      return null;
    }
  }

  async saveFeatured(bucketKey: string, entry: FeaturedCacheEntry): Promise<void> {
    await AsyncStorage.setItem(keyFor(bucketKey), JSON.stringify(entry));
  }

  async clearFeatured(bucketKey: string): Promise<void> {
    await AsyncStorage.removeItem(keyFor(bucketKey));
  }
}
