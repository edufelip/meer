import { AsyncStorageProfileLocalDataSource } from "../data/datasources/impl/AsyncStorageProfileLocalDataSource";
import type { User } from "../domain/entities/User";

const profileLocal = new AsyncStorageProfileLocalDataSource();

type MinimalProfile = User & {
  bio?: string;
  notifyNewStores?: boolean;
  notifyPromos?: boolean;
  ownedThriftStore?: any;
};

export async function cacheProfile(profile: MinimalProfile) {
  // Fill safe defaults for optional flags to avoid undefined in UI.
  const normalized: MinimalProfile = {
    ...profile,
    id: profile.id ? String(profile.id) : profile.id,
    notifyNewStores: profile.notifyNewStores ?? false,
    notifyPromos: profile.notifyPromos ?? false
  };
  await profileLocal.saveProfile(normalized as any);
}
