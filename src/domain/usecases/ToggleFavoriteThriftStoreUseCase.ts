import type { ThriftStore } from "../entities/ThriftStore";
import type { FavoriteRepository } from "../repositories/FavoriteRepository";

export class ToggleFavoriteThriftStoreUseCase {
  constructor(private readonly repository: FavoriteRepository) {}

  execute(store: ThriftStore): Promise<boolean> {
    return this.repository.toggle(store);
  }
}
