import type { GuideContent, GuideContentId } from "../entities/GuideContent";

export type GuideContentSort = "newest" | "oldest";

export type GuideContentListParams = {
  /**
   * Search over title OR description (case-insensitive contains).
   */
  q?: string;
  /**
   * Sort by createdAt.
   */
  sort?: GuideContentSort;
  /**
   * 0-based page index.
   */
  page?: number;
  pageSize?: number;
  /**
   * Optional store filter (used by owner screens).
   */
  storeId?: string;
};

export type GuideContentPage = {
  items: GuideContent[];
  page: number;
  hasNext: boolean;
};

export interface GuideContentRepository {
  listLatest(params?: GuideContentListParams): Promise<GuideContentPage>;
  getById(id: GuideContentId): Promise<GuideContent | null>;
  createContent(payload: { title: string; description?: string; storeId: string }): Promise<{ id: string }>;
  updateContent(id: string, payload: { title?: string; description?: string; imageUrl?: string }): Promise<void>;
  requestImageUpload(
    contentId: string,
    contentType?: string
  ): Promise<{ uploadUrl: string; fileKey: string; contentType: string }>;
  deleteContent(id: string): Promise<void>;
}
