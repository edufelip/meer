import type { User, UserId } from "../../domain/entities/User";
import type { UserRepository } from "../../domain/repositories/UserRepository";
import type { UserLocalDataSource } from "../datasources/UserLocalDataSource";

export class UserRepositoryImpl implements UserRepository {
  private readonly localDataSource: UserLocalDataSource;

  constructor(localDataSource: UserLocalDataSource) {
    this.localDataSource = localDataSource;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.localDataSource.getCurrentUser();
  }

  async getUserById(_id: UserId): Promise<User | null> {
    // Demo: reuse current user; in real impl fetch by id
    return this.localDataSource.getCurrentUser();
  }
}
