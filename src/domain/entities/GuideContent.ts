export type GuideContentId = string;

export interface GuideContent {
  id: GuideContentId;
  title: string;
  description: string;
  categoryLabel: string;
  imageUrl: string;
  storeId: import("./ThriftStore").ThriftStoreId;
}
