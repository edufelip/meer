import type { User, UserId } from "../entities/User";

export interface UserRepository {
  getCurrentUser(): Promise<User | null>;
  getUserById(id: UserId): Promise<User | null>;
}
