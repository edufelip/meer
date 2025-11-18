import type { User } from "../../domain/entities/User";

export interface UserLocalDataSource {
  getCurrentUser(): Promise<User | null>;
}
