import { api } from "../../../api/client";
import type { User } from "../../../domain/entities/User";
import type { ProfileRemoteDataSource } from "../ProfileRemoteDataSource";

type ProfilePayload = User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any };
type ProfileEnvelope = { user: ProfilePayload };

export class HttpProfileRemoteDataSource implements ProfileRemoteDataSource {
  async getProfile(): Promise<ProfilePayload> {
    // Backend endpoint that returns the authenticated user's profile data.
    const res = await api.get<ProfileEnvelope | ProfilePayload>("/auth/me");
    const body: any = res.data;
    const profile = (body?.user ?? body) as ProfilePayload;
    return {
      ...profile,
      id: profile.id ? String(profile.id) : profile.id,
      notifyNewStores: profile.notifyNewStores ?? false,
      notifyPromos: profile.notifyPromos ?? false
    };
  }

  async updateProfile(
    payload: Partial<User> & {
      bio?: string;
      notifyNewStores?: boolean;
      notifyPromos?: boolean;
      avatarUrl?: string;
      photoUrl?: string;
    }
  ): Promise<ProfilePayload> {
    const body: any = { ...payload };

    const res = await api.patch<ProfilePayload>("/profile", body, {
      headers: { "Content-Type": "application/json" }
    });
    return res.data;
  }

  async deleteAccount(email: string): Promise<void> {
    await api.delete("/account", { data: { email } });
  }

  async requestAvatarUploadSlot(contentType?: string): Promise<{ uploadUrl: string; fileKey: string; contentType: string }> {
    const res = await api.post(
      "/profile/avatar/upload",
      contentType ? { contentType } : {},
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  }
}
