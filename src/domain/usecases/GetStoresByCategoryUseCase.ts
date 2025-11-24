import type { ThriftStoreRepository } from "../repositories/ThriftStoreRepository";
import type { ThriftStore } from "../entities/ThriftStore";

export class GetStoresByCategoryUseCase {
  constructor(private readonly repository: ThriftStoreRepository) {}

  execute(params: {
    categoryId: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ThriftStore[]; page: number; hasNext: boolean }> {
    return this.repository.listByCategory(params);
  }
}
