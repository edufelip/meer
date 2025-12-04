import type { User } from "../entities/User";

export interface ProfileRepository {
  getProfile(): Promise<
    User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any }
  >;
  updateProfile(
    payload: Partial<User> & {
      bio?: string;
      notifyNewStores?: boolean;
      notifyPromos?: boolean;
      avatarUrl?: string;
    }
  ): Promise<User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any }>;
  getCachedProfile(): Promise<
    (User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any }) | null
  >;
  deleteAccount(email: string): Promise<void>;
  requestAvatarUploadSlot(contentType?: string): Promise<{ uploadUrl: string; fileKey: string; contentType: string }>;
}
