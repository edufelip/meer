import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../../../domain/entities/User";
import type { ProfileLocalDataSource } from "../ProfileLocalDataSource";

export const PROFILE_KEY = "PROFILE_CACHE";

type ProfilePayload = User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any };

export class AsyncStorageProfileLocalDataSource implements ProfileLocalDataSource {
  async getProfile(): Promise<ProfilePayload | null> {
    const stored = await AsyncStorage.getItem(PROFILE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as ProfilePayload;
      return {
        ...parsed,
        id: parsed.id ? String(parsed.id) : parsed.id,
        notifyNewStores: parsed.notifyNewStores ?? false,
        notifyPromos: parsed.notifyPromos ?? false
      };
    } catch {
      return null;
    }
  }

  async saveProfile(profile: ProfilePayload): Promise<void> {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  async clearProfile(): Promise<void> {
    await AsyncStorage.removeItem(PROFILE_KEY);
  }
}
