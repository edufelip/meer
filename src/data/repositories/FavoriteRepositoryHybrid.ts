import type { FavoriteRepository } from "../../domain/repositories/FavoriteRepository";
import type { ThriftStore, ThriftStoreId } from "../../domain/entities/ThriftStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FavoriteRemoteDataSource } from "../datasources/FavoriteRemoteDataSource";

const STORAGE_KEY = "favorites";

async function readAll(): Promise<ThriftStore[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ThriftStore[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(stores: ThriftStore[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stores));
}

/**
 * Hybrid favorite repository: optimistic local update, then sync remote.
 * If remote fails, local state stays but we log; next refresh will correct.
 */
export class FavoriteRepositoryHybrid implements FavoriteRepository {
  constructor(private readonly remote: FavoriteRemoteDataSource) {}

  async getAll(): Promise<ThriftStore[]> {
    try {
      const remote = await this.remote.list();
      await writeAll(remote);
      return remote;
    } catch (e) {
      // fallback to cache
      return readAll();
    }
  }

  async isFavorite(id: ThriftStoreId): Promise<boolean> {
    const cached = await readAll();
    return cached.some((s) => s.id === id);
  }

  async toggle(store: ThriftStore): Promise<boolean> {
    const cached = await readAll();
    const exists = cached.findIndex((s) => s.id === store.id);
    let newState: ThriftStore[];
    let nowFavorite: boolean;

    if (exists >= 0) {
      cached.splice(exists, 1);
      newState = [...cached];
      nowFavorite = false;
      writeAll(newState); // optimistic
      this.remote.remove(store.id).catch(() => {});
    } else {
      newState = [...cached, store];
      nowFavorite = true;
      writeAll(newState); // optimistic
      this.remote.add(store.id).catch(() => {});
    }

    return nowFavorite;
  }
}
