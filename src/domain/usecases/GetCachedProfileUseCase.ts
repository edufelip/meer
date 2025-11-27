import type { ProfileRepository } from "../repositories/ProfileRepository";
import type { User } from "../entities/User";

export class GetCachedProfileUseCase {
  private readonly repository: ProfileRepository;

  constructor(repository: ProfileRepository) {
    this.repository = repository;
  }

  execute(): Promise<
    (User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any }) | null
  > {
    return this.repository.getCachedProfile();
  }
}
