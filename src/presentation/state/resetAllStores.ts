import { useFavoritesStore } from "./favoritesStore";
import { useProfileSummaryStore } from "./profileSummaryStore";
import { useStoreSummaryStore } from "./storeSummaryStore";

export function resetAllStores() {
  useStoreSummaryStore.getState().reset();
  useFavoritesStore.getState().reset();
  useProfileSummaryStore.getState().reset();
}
