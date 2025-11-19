import type { Category } from "../entities/Category";

export interface CategoryRepository {
  list(): Promise<Category[]>;
}
