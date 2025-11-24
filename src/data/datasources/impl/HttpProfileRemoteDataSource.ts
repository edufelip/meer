import { api } from "../../../api/client";
import type { User } from "../../../domain/entities/User";
import type { ProfileRemoteDataSource } from "../ProfileRemoteDataSource";

type ProfilePayload = User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any };

export class HttpProfileRemoteDataSource implements ProfileRemoteDataSource {
  async getProfile(): Promise<ProfilePayload> {
    const res = await api.get<ProfilePayload>("/profile");
    return res.data;
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
}
