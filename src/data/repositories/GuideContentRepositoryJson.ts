import type { GuideContentListParams, GuideContentRepository } from "../../domain/repositories/GuideContentRepository";
import type { GuideContentRemoteDataSource } from "../datasources/GuideContentRemoteDataSource";

export class GuideContentRepositoryJson implements GuideContentRepository {
  private readonly remote: GuideContentRemoteDataSource;

  constructor(remote: GuideContentRemoteDataSource) {
    this.remote = remote;
  }

  listLatest(params?: GuideContentListParams) {
    return this.remote.listLatest(params);
  }

  getById(id: string) {
    return this.remote.getById(id);
  }

  createContent(payload: { title: string; description?: string; storeId: string }): Promise<{ id: string }> {
    return this.remote.createContent(payload);
  }

  updateContent(id: string, payload: { title?: string; description?: string; imageUrl?: string }): Promise<void> {
    return this.remote.updateContent(id, payload);
  }

  requestImageUpload(
    contentId: string,
    contentType?: string
  ): Promise<{ uploadUrl: string; fileKey: string; contentType: string }> {
    return this.remote.requestImageUpload(contentId, contentType);
  }

  deleteContent(id: string): Promise<void> {
    return this.remote.deleteContent(id);
  }
}
