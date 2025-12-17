import type { ThriftStore } from "../entities/ThriftStore";
import type { GuideContent } from "../entities/GuideContent";
import type { ThriftStoreRepository } from "../repositories/ThriftStoreRepository";
import type { GuideContentRepository } from "../repositories/GuideContentRepository";

export class GetHomeUseCase {
  constructor(
    private readonly thriftStoreRepository: ThriftStoreRepository,
    private readonly guideContentRepository: GuideContentRepository
  ) {}

  async execute(params?: {
    lat?: number;
    lng?: number;
  }): Promise<{ featured: ThriftStore[]; nearby: ThriftStore[]; content: GuideContent[] }> {
    const [featured, nearbyPage, contentPage] = await Promise.all([
      this.thriftStoreRepository.getFeatured(params),
      this.thriftStoreRepository.listNearbyPaginated({
        page: 1,
        pageSize: 10,
        lat: params?.lat,
        lng: params?.lng
      }),
      this.guideContentRepository.listLatest({ page: 0, pageSize: 10 })
    ]);

    return {
      featured: featured ?? [],
      nearby: nearbyPage.items ?? [],
      content: contentPage.items ?? []
    };
  }
}
