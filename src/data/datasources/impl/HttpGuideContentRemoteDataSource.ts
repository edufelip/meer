import type { GuideContent } from "../../../domain/entities/GuideContent";
import type { GuideContentRemoteDataSource } from "../GuideContentRemoteDataSource";
import { api } from "../../../api/client";

export class HttpGuideContentRemoteDataSource implements GuideContentRemoteDataSource {
  async listLatest(): Promise<GuideContent[]> {
    const res = await api.get<GuideContent[]>("/content", { params: { limit: 20 } });
    return res.data;
  }
}
