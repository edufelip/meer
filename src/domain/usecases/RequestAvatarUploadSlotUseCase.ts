import type { ProfileRepository } from "../repositories/ProfileRepository";

export class RequestAvatarUploadSlotUseCase {
  constructor(private readonly repo: ProfileRepository) {}

  execute(contentType?: string): Promise<{ uploadUrl: string; fileKey: string; contentType: string }> {
    return this.repo.requestAvatarUploadSlot(contentType);
  }
}
