import type { GuideContent } from "../../domain/entities/GuideContent";
import type { GuideContentRepository } from "../../domain/repositories/GuideContentRepository";
import type { GuideContentRemoteDataSource } from "../datasources/GuideContentRemoteDataSource";

export class GuideContentRepositoryJson implements GuideContentRepository {
  private readonly remote: GuideContentRemoteDataSource;

  constructor(remote: GuideContentRemoteDataSource) {
    this.remote = remote;
  }

  listLatest(): Promise<GuideContent[]> {
    return this.remote.listLatest();
  }
}
