import type { User } from "../entities/User";
import type { UserRepository } from "../repositories/UserRepository";

export class GetCurrentUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(): Promise<User | null> {
    return this.userRepository.getCurrentUser();
  }
}
