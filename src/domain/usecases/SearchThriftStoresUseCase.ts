import type { ThriftStore } from "../entities/ThriftStore";
import type { ThriftStoreRepository } from "../repositories/ThriftStoreRepository";

export class SearchThriftStoresUseCase {
  constructor(private readonly repository: ThriftStoreRepository) {}

  execute(query: string): Promise<ThriftStore[]> {
    return this.repository.search(query);
  }
}
