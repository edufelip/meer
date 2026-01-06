import type { GuideContent } from "../../domain/entities/GuideContent";
import type { GuideContentListParams, GuideContentPage } from "../../domain/repositories/GuideContentRepository";

export interface GuideContentRemoteDataSource {
  listLatest(params?: GuideContentListParams): Promise<GuideContentPage>;
  getById(id: string): Promise<GuideContent | null>;
  createContent(payload: { title: string; description?: string; storeId: string }): Promise<{ id: string }>;
  updateContent(id: string, payload: { title?: string; description?: string; imageUrl?: string }): Promise<void>;
  requestImageUpload(
    contentId: string,
    contentType?: string
  ): Promise<{ uploadUrl: string; fileKey: string; contentType: string }>;
  deleteContent(id: string): Promise<void>;
}
