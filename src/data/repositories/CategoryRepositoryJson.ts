import type { Category } from "../../domain/entities/Category";
import type { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import type { CategoryRemoteDataSource } from "../datasources/CategoryRemoteDataSource";

export class CategoryRepositoryJson implements CategoryRepository {
  private readonly remote: CategoryRemoteDataSource;

  constructor(remote: CategoryRemoteDataSource) {
    this.remote = remote;
  }

  list(): Promise<Category[]> {
    return this.remote.list();
  }
}
