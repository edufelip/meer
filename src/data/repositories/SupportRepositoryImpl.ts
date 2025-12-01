import type { SupportRepository } from "../../domain/repositories/SupportRepository";
import type { SupportMessagePayload, SupportRemoteDataSource } from "../datasources/SupportRemoteDataSource";

export class SupportRepositoryImpl implements SupportRepository {
  constructor(private readonly remote: SupportRemoteDataSource) {}

  sendMessage(payload: SupportMessagePayload): Promise<void> {
    return this.remote.sendMessage(payload);
  }
}
