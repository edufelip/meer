export type ThriftStoreId = string;

export interface ThriftStore {
  id: ThriftStoreId;
  name: string;
  tagline: string; // short subheading for hero/detail

  // Media
  coverImageUrl: string; // hero image
  galleryUrls?: string[]; // supporting gallery

  // Location
  addressLine: string; // e.g., "Rua das Flores, 123 - Centro"
  latitude?: number;
  longitude?: number;
  mapImageUrl?: string; // optional static map image

  // Hours
  openingHours: string; // e.g., "Segunda a Sábado: 10:00 - 19:00"
  openingHoursNotes?: string;

  // Social
  social?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  };

  // Taxonomy
  categories: string[]; // e.g., ["Feminino", "Vintage", "Acessórios"]

  // Listing helpers
  distanceKm?: number;
  walkTimeMinutes?: number;
  neighborhood?: string;
  badgeLabel?: string; // e.g., "Mais amado"
  isFavorite?: boolean;

  // Optional longer copy
  description?: string;
}
