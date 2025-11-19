export type ThriftStoreId = string;

export interface ThriftStore {
  id: ThriftStoreId;
  name: string;
  description: string;
  imageUrl: string;
  badgeLabel?: string;
  distanceKm?: number;
  neighborhood?: string;
}
