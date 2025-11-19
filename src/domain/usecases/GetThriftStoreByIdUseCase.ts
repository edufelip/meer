import type { ThriftStore, ThriftStoreId } from "../entities/ThriftStore";
import type { ThriftStoreRepository } from "../repositories/ThriftStoreRepository";

export class GetThriftStoreByIdUseCase {
  private readonly repository: ThriftStoreRepository;

  constructor(repository: ThriftStoreRepository) {
    this.repository = repository;
  }

  execute(id: ThriftStoreId): Promise<ThriftStore | null> {
    return this.repository.getById(id);
  }
}
