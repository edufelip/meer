import type { GuideContent } from "../../../domain/entities/GuideContent";
import type { GuideContentRemoteDataSource } from "../GuideContentRemoteDataSource";
import guideContents from "../../mocks/guideContents.json";
import { loadFromJson } from "./LocalJsonClient";

export class JsonGuideContentRemoteDataSource implements GuideContentRemoteDataSource {
  async listLatest(): Promise<GuideContent[]> {
    return loadFromJson<GuideContent[]>(guideContents as GuideContent[]);
  }
}
