import type { User } from "../../domain/entities/User";

export interface ProfileRemoteDataSource {
  getProfile(): Promise<User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean }>;
  updateProfile(
    payload: Partial<User> & {
      bio?: string;
      notifyNewStores?: boolean;
      notifyPromos?: boolean;
      avatarUrl?: string;
    }
  ): Promise<User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean }>;
  deleteAccount(email: string): Promise<void>;
  requestAvatarUploadSlot(contentType?: string): Promise<{ uploadUrl: string; fileKey: string; contentType: string }>;
}
