import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";
import type { FavoriteRepository } from "../../domain/repositories/FavoriteRepository";

const STORAGE_KEY = "favorites";

async function readAll(): Promise<ThriftStore[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ThriftStore[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to parse favorites", e);
    return [];
  }
}

async function writeAll(stores: ThriftStore[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
}

export class FavoriteRepositoryAsyncStorage implements FavoriteRepository {
  async getAll(): Promise<ThriftStore[]> {
    return readAll();
  }

  async isFavorite(id: ThriftStoreId): Promise<boolean> {
    const all = await readAll();
    return all.some((s) => s.id === id);
  }

  async toggle(store: ThriftStore): Promise<boolean> {
    const all = await readAll();
    const exists = all.findIndex((s) => s.id === store.id);
    if (exists >= 0) {
      all.splice(exists, 1);
      await writeAll(all);
      return false;
    }
    const updated = [...all, store];
    await writeAll(updated);
    return true;
  }
}
