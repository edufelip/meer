import type { Category } from "../../../domain/entities/Category";
import type { CategoryRemoteDataSource } from "../CategoryRemoteDataSource";
import categories from "../../mocks/categories.json";
import { loadFromJson } from "./LocalJsonClient";

export class JsonCategoryRemoteDataSource implements CategoryRemoteDataSource {
  async list(): Promise<Category[]> {
    return loadFromJson<Category[]>(categories as Category[]);
  }
}
