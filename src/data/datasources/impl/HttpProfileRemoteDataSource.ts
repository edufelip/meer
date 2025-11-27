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
      avatarFile?: { uri: string; name?: string; type?: string };
    }
  ): Promise<ProfilePayload> {
    const form = new FormData();

    if (payload.name !== undefined) form.append("name", payload.name);
    if (payload.bio !== undefined) form.append("bio", payload.bio);
    if (payload.notifyNewStores !== undefined) form.append("notifyNewStores", String(payload.notifyNewStores));
    if (payload.notifyPromos !== undefined) form.append("notifyPromos", String(payload.notifyPromos));
    if (payload.avatarUrl) form.append("avatarUrl", payload.avatarUrl);
    if (payload.avatarFile) {
      form.append("avatar", {
        uri: payload.avatarFile.uri,
        name: payload.avatarFile.name ?? "avatar.jpg",
        type: payload.avatarFile.type ?? "image/jpeg"
      } as any);
    }

    const res = await api.patch<ProfilePayload>("/profile", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  }

  async deleteAccount(email: string): Promise<void> {
    await api.delete("/account", { data: { email } });
  }
}
