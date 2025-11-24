import type { ProfileRepository } from "../repositories/ProfileRepository";
import type { User } from "../entities/User";

type ProfilePayload =
  Partial<User> & {
    bio?: string;
    notifyNewStores?: boolean;
    notifyPromos?: boolean;
    avatarUrl?: string;
    avatarFile?: { uri: string; name?: string; type?: string };
  };

export class UpdateProfileUseCase {
  private readonly repository: ProfileRepository;

  constructor(repository: ProfileRepository) {
    this.repository = repository;
  }

  execute(payload: ProfilePayload): Promise<
    User & { bio?: string; notifyNewStores: boolean; notifyPromos: boolean; ownedThriftStore?: any }
  > {
    return this.repository.updateProfile(payload);
  }
}
