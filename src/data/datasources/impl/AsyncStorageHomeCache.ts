import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThriftStore } from "../../../domain/entities/ThriftStore";
import type { GuideContent } from "../../../domain/entities/GuideContent";

export type HomeCache = {
  featured: ThriftStore[];
  nearby: ThriftStore[];
  contents: GuideContent[];
  fetchedAt: number;
};

const PREFIX = "home-cache";
const keyFor = (bucket: string) => `${PREFIX}:${bucket}`;

export async function loadHomeCache(bucket: string): Promise<HomeCache | null> {
  const raw = await AsyncStorage.getItem(keyFor(bucket));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HomeCache;
  } catch {
    return null;
  }
}

export async function saveHomeCache(bucket: string, cache: HomeCache): Promise<void> {
  await AsyncStorage.setItem(keyFor(bucket), JSON.stringify(cache));
}

export async function clearHomeCache(bucket: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(bucket));
}
