import type { GuideContentListParams, GuideContentPage, GuideContentRepository } from "../repositories/GuideContentRepository";

export class GetGuideContentUseCase {
  private readonly repository: GuideContentRepository;

  constructor(repository: GuideContentRepository) {
    this.repository = repository;
  }

  execute(params?: GuideContentListParams): Promise<GuideContentPage> {
    return this.repository.listLatest(params);
  }
}
