import type { ThriftStore, ThriftStoreId } from "../entities/ThriftStore";

export interface FavoriteRepository {
  getAll(): Promise<ThriftStore[]>;
  isFavorite(id: ThriftStoreId): Promise<boolean>;
  toggle(store: ThriftStore): Promise<boolean>; // returns new favorite state
}
