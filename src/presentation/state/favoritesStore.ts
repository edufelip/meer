import { create } from "zustand";
import type { ThriftStore } from "../../domain/entities/ThriftStore";

type FavoriteIds = Record<string, true>;

type FavoritesState = {
  items: ThriftStore[];
  ids: FavoriteIds;
  fetchedAt: number | null;
  loading: boolean;
  refreshing: boolean;
  setFavorites: (items: ThriftStore[], fetchedAt?: number | null) => void;
  setFavoriteId: (storeId: string, isFavorite: boolean) => void;
  setFavoriteItem: (store: ThriftStore, isFavorite: boolean) => void;
  setLoading: (value: boolean) => void;
  setRefreshing: (value: boolean) => void;
  reset: () => void;
};

const buildIdMap = (items: ThriftStore[]): FavoriteIds =>
  items.reduce<FavoriteIds>((acc, item) => {
    if (item?.id) acc[item.id] = true;
    return acc;
  }, {});

export const useFavoritesStore = create<FavoritesState>((set) => ({
  items: [],
  ids: {},
  fetchedAt: null,
  loading: true,
  refreshing: false,
  setFavorites: (items, fetchedAt) => {
    set({
      items,
      ids: buildIdMap(items),
      fetchedAt: fetchedAt ?? null
    });
  },
  setFavoriteId: (storeId, isFavorite) => {
    set((state) => {
      if (!storeId) return state;
      const ids = { ...state.ids };
      if (isFavorite) {
        ids[storeId] = true;
      } else {
        delete ids[storeId];
      }
      return { ids };
    });
  },
  setFavoriteItem: (store, isFavorite) => {
    set((state) => {
      if (!store?.id) return state;
      const ids = { ...state.ids };
      let items = state.items;

      if (isFavorite) {
        ids[store.id] = true;
        const exists = state.items.some((item) => item.id === store.id);
        items = exists ? state.items : [store, ...state.items];
      } else {
        delete ids[store.id];
        items = state.items.filter((item) => item.id !== store.id);
      }

      return { ids, items };
    });
  },
  setLoading: (value) => set({ loading: value }),
  setRefreshing: (value) => set({ refreshing: value }),
  reset: () =>
    set({
      items: [],
      ids: {},
      fetchedAt: null,
      loading: true,
      refreshing: false
    })
}));
