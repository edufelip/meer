import type { GuideContent, GuideContentId } from "../entities/GuideContent";
import type { GuideContentRepository } from "../repositories/GuideContentRepository";

export class GetGuideContentByIdUseCase {
  constructor(private readonly repo: GuideContentRepository) {}

  execute(id: GuideContentId): Promise<GuideContent | null> {
    return this.repo.getById(id);
  }
}
