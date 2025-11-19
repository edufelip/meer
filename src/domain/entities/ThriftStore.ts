export type ThriftStoreId = string;

export interface ThriftStore {
  id: ThriftStoreId;
  name: string;
  description: string;
  imageUrl: string;
  badgeLabel?: string;
  distanceKm?: number;
  neighborhood?: string;
  addressLine?: string;
  walkTimeMinutes?: number;
  mapImageUrl?: string;
  galleryUrls?: string[];
  socialHandle?: string;
  openingHours?: string;
  categories?: string[];
}
