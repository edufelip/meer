import type { ThriftStoreId } from "../entities/ThriftStore";
import type { FavoriteRepository } from "../repositories/FavoriteRepository";

export class IsFavoriteThriftStoreUseCase {
  constructor(private readonly repository: FavoriteRepository) {}

  execute(id: ThriftStoreId): Promise<boolean> {
    return this.repository.isFavorite(id);
  }
}
