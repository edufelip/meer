import type { User } from "../../domain/entities/User";
import type { ProfileRepository } from "../../domain/repositories/ProfileRepository";
import type { ProfileRemoteDataSource } from "../datasources/ProfileRemoteDataSource";
import type { ProfileLocalDataSource } from "../datasources/ProfileLocalDataSource";

type ProfilePayload = User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any };

export class ProfileRepositoryJson implements ProfileRepository {
  private readonly remote: ProfileRemoteDataSource;
  private readonly local: ProfileLocalDataSource;

  constructor(remote: ProfileRemoteDataSource, local: ProfileLocalDataSource) {
    this.remote = remote;
    this.local = local;
  }

  async getProfile(): Promise<ProfilePayload> {
    const profile = await this.remote.getProfile();
    await this.local.saveProfile(profile);
    return profile;
  }

  async updateProfile(payload: Partial<ProfilePayload>): Promise<ProfilePayload> {
    const updated = await this.remote.updateProfile(payload);
    await this.local.saveProfile(updated);
    return updated;
  }

  async getCachedProfile(): Promise<ProfilePayload | null> {
    return this.local.getProfile();
  }

  async deleteAccount(email: string): Promise<void> {
    await this.remote.deleteAccount(email);
    await this.local.clearProfile?.();
  }

  requestAvatarUploadSlot(contentType?: string): Promise<{ uploadUrl: string; fileKey: string; contentType: string }> {
    return this.remote.requestAvatarUploadSlot(contentType);
  }
}
