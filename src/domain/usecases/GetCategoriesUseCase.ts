import type { Category } from "../entities/Category";
import type { CategoryRepository } from "../repositories/CategoryRepository";

export class GetCategoriesUseCase {
  private readonly repository: CategoryRepository;

  constructor(repository: CategoryRepository) {
    this.repository = repository;
  }

  execute(): Promise<Category[]> {
    return this.repository.list();
  }
}
