import type { Category } from "../../../domain/entities/Category";
import type { CategoryRemoteDataSource } from "../CategoryRemoteDataSource";
import { api } from "../../../api/client";

export class HttpCategoryRemoteDataSource implements CategoryRemoteDataSource {
  async list(): Promise<Category[]> {
    const res = await api.get<Category[]>("/categories");
    return res.data;
  }
}
