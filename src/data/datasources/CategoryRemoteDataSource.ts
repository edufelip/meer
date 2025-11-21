import type { Category } from "../../domain/entities/Category";

export interface CategoryRemoteDataSource {
  list(): Promise<Category[]>;
}
