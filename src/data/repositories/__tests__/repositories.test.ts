import AsyncStorage from "@react-native-async-storage/async-storage";
import { CategoryRepositoryJson } from "../CategoryRepositoryJson";
import { FeedbackRepositoryImpl } from "../FeedbackRepositoryImpl";
import { FavoriteRepositoryAsyncStorage } from "../FavoriteRepositoryAsyncStorage";
import { FavoriteRepositoryHybrid } from "../FavoriteRepositoryHybrid";
import { GuideContentRepositoryJson } from "../GuideContentRepositoryJson";
import { ProfileRepositoryJson } from "../ProfileRepositoryJson";
import { SupportRepositoryImpl } from "../SupportRepositoryImpl";
import { ThriftStoreRepositoryJson } from "../ThriftStoreRepositoryJson";
import { UserRepositoryImpl } from "../UserRepositoryImpl";

jest.mock("@react-native-async-storage/async-storage", () => {
  let store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __reset: () => {
      store.clear();
    }
  };
});

type AsyncStorageMock = {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  __reset: () => void;
};

const asyncStorageMock = AsyncStorage as unknown as AsyncStorageMock;

beforeEach(() => {
  asyncStorageMock.__reset();
  jest.clearAllMocks();
});

describe("CategoryRepositoryJson", () => {
  it("fetches remote and caches locally", async () => {
    const remote = {
      list: jest.fn().mockResolvedValue([{ id: "cat-1", nameStringId: "brecho_de_casa", imageResId: "img" }])
    };
    const local = { saveCategories: jest.fn(), getCategories: jest.fn() };
    const repo = new CategoryRepositoryJson(remote as any, local as any);

    const result = await repo.list();

    expect(remote.list).toHaveBeenCalledTimes(1);
    expect(local.saveCategories).toHaveBeenCalledWith([
      { id: "cat-1", nameStringId: "brecho_de_casa", imageResId: "img" }
    ]);
    expect(result).toEqual([{ id: "cat-1", nameStringId: "brecho_de_casa", imageResId: "img" }]);
  });

  it("exposes cached categories", async () => {
    const local = {
      getCategories: jest.fn().mockResolvedValue([{ id: "cat-2", nameStringId: "brecho_feminino", imageResId: "img" }]),
      saveCategories: jest.fn()
    };
    const repo = new CategoryRepositoryJson({ list: jest.fn() } as any, local as any);

    const result = await repo.getCached();

    expect(local.getCategories).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "cat-2", nameStringId: "brecho_feminino", imageResId: "img" }]);
  });

  it("saves cache", async () => {
    const local = { saveCategories: jest.fn() };
    const repo = new CategoryRepositoryJson({ list: jest.fn() } as any, local as any);

    await repo.saveCache([{ id: "cat-3", nameStringId: "brecho_de_desapego", imageResId: "img" }]);

    expect(local.saveCategories).toHaveBeenCalledWith([
      { id: "cat-3", nameStringId: "brecho_de_desapego", imageResId: "img" }
    ]);
  });
});

describe("GuideContentRepositoryJson", () => {
  it("delegates guide content calls", async () => {
    const remote = {
      listLatest: jest.fn().mockResolvedValue({ items: [] }),
      getById: jest.fn().mockResolvedValue({ id: "content-1" }),
      createContent: jest.fn().mockResolvedValue({ id: "content-1" }),
      updateContent: jest.fn().mockResolvedValue(undefined),
      requestImageUpload: jest.fn().mockResolvedValue({ uploadUrl: "url", fileKey: "key", contentType: "image/png" }),
      deleteContent: jest.fn().mockResolvedValue(undefined)
    };
    const repo = new GuideContentRepositoryJson(remote as any);

    expect(await repo.listLatest({ page: 1 })).toEqual({ items: [] });
    expect(await repo.getById("content-1")).toEqual({ id: "content-1" });
    expect(await repo.createContent({ title: "Title", storeId: "store" })).toEqual({ id: "content-1" });

    await repo.updateContent("content-1", { title: "Updated" });
    await repo.requestImageUpload("content-1", "image/png");
    await repo.deleteContent("content-1");

    expect(remote.listLatest).toHaveBeenCalledWith({ page: 1 });
    expect(remote.getById).toHaveBeenCalledWith("content-1");
    expect(remote.createContent).toHaveBeenCalledWith({ title: "Title", storeId: "store" });
    expect(remote.updateContent).toHaveBeenCalledWith("content-1", { title: "Updated" });
    expect(remote.requestImageUpload).toHaveBeenCalledWith("content-1", "image/png");
    expect(remote.deleteContent).toHaveBeenCalledWith("content-1");
  });
});

describe("ProfileRepositoryJson", () => {
  it("caches profile on fetch and update", async () => {
    const remote = {
      getProfile: jest.fn().mockResolvedValue({ id: "user-1", notifyNewStores: false, notifyPromos: false }),
      updateProfile: jest.fn().mockResolvedValue({ id: "user-1", notifyNewStores: true, notifyPromos: false }),
      deleteAccount: jest.fn().mockResolvedValue(undefined),
      requestAvatarUploadSlot: jest.fn().mockResolvedValue({ uploadUrl: "url", fileKey: "key", contentType: "image/png" })
    };
    const local = {
      saveProfile: jest.fn(),
      getProfile: jest.fn().mockResolvedValue({ id: "user-1", notifyNewStores: false, notifyPromos: false }),
      clearProfile: jest.fn().mockResolvedValue(undefined)
    };
    const repo = new ProfileRepositoryJson(remote as any, local as any);

    const profile = await repo.getProfile();
    const updated = await repo.updateProfile({ notifyNewStores: true });
    const cached = await repo.getCachedProfile();
    await repo.deleteAccount("user@example.com");
    const upload = await repo.requestAvatarUploadSlot("image/png");

    expect(remote.getProfile).toHaveBeenCalledTimes(1);
    expect(local.saveProfile).toHaveBeenCalledWith(profile);
    expect(remote.updateProfile).toHaveBeenCalledWith({ notifyNewStores: true });
    expect(local.saveProfile).toHaveBeenCalledWith(updated);
    expect(cached).toEqual({ id: "user-1", notifyNewStores: false, notifyPromos: false });
    expect(remote.deleteAccount).toHaveBeenCalledWith("user@example.com");
    expect(local.clearProfile).toHaveBeenCalledTimes(1);
    expect(upload).toEqual({ uploadUrl: "url", fileKey: "key", contentType: "image/png" });
  });
});

describe("UserRepositoryImpl", () => {
  it("returns current user and uses same source for getUserById", async () => {
    const local = { getCurrentUser: jest.fn().mockResolvedValue({ id: "user-1" }) };
    const repo = new UserRepositoryImpl(local as any);

    expect(await repo.getCurrentUser()).toEqual({ id: "user-1" });
    expect(await repo.getUserById("user-2")).toEqual({ id: "user-1" });
    expect(local.getCurrentUser).toHaveBeenCalledTimes(2);
  });
});

describe("SupportRepositoryImpl", () => {
  it("delegates sendMessage", async () => {
    const remote = { sendMessage: jest.fn().mockResolvedValue(undefined) };
    const repo = new SupportRepositoryImpl(remote as any);

    await repo.sendMessage({ message: "help" } as any);

    expect(remote.sendMessage).toHaveBeenCalledWith({ message: "help" });
  });
});

describe("FeedbackRepositoryImpl", () => {
  it("delegates feedback operations", async () => {
    const remote = {
      getMine: jest.fn().mockResolvedValue({ id: "feedback-1" }),
      upsert: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      listStoreRatings: jest.fn().mockResolvedValue({ items: [], page: 1, hasNext: false })
    };
    const repo = new FeedbackRepositoryImpl(remote as any);

    expect(await repo.getMine("store-1")).toEqual({ id: "feedback-1" });
    await repo.upsert({ storeId: "store-1", score: 5 } as any);
    await repo.delete("store-1");
    const ratings = await repo.listStoreRatings({ storeId: "store-1", page: 2, pageSize: 5 });

    expect(remote.getMine).toHaveBeenCalledWith("store-1");
    expect(remote.upsert).toHaveBeenCalledWith({ storeId: "store-1", score: 5 });
    expect(remote.delete).toHaveBeenCalledWith("store-1");
    expect(remote.listStoreRatings).toHaveBeenCalledWith({ storeId: "store-1", page: 2, pageSize: 5 });
    expect(ratings).toEqual({ items: [], page: 1, hasNext: false });
  });
});

describe("FavoriteRepositoryAsyncStorage", () => {
  it("returns empty list when storage is empty", async () => {
    const repo = new FavoriteRepositoryAsyncStorage();

    expect(await repo.getAll()).toEqual([]);
  });

  it("toggles favorites on and off", async () => {
    const repo = new FavoriteRepositoryAsyncStorage();
    const store = { id: "store-1" } as any;

    const added = await repo.toggle(store);
    const isFavorite = await repo.isFavorite("store-1");
    const removed = await repo.toggle(store);
    const afterRemove = await repo.getAll();
    await repo.syncPending();

    expect(added).toBe(true);
    expect(isFavorite).toBe(true);
    expect(removed).toBe(false);
    expect(afterRemove).toEqual([]);
  });

  it("handles malformed storage data", async () => {
    const repo = new FavoriteRepositoryAsyncStorage();
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    await AsyncStorage.setItem("favorites", "not-json");

    const result = await repo.getAll();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("FavoriteRepositoryHybrid", () => {
  it("returns remote list and caches locally", async () => {
    const remote = { list: jest.fn().mockResolvedValue([{ id: "store-1" }]) };
    const repo = new FavoriteRepositoryHybrid(remote as any);

    const result = await repo.getAll();

    expect(result).toEqual([{ id: "store-1" }]);
    expect(remote.list).toHaveBeenCalledTimes(1);
    expect(asyncStorageMock.setItem).toHaveBeenCalledWith("favorites", JSON.stringify([{ id: "store-1" }]));
  });

  it("falls back to cache when remote fails", async () => {
    const remote = { list: jest.fn().mockRejectedValue(new Error("fail")) };
    await AsyncStorage.setItem("favorites", JSON.stringify([{ id: "store-2" }]));
    const repo = new FavoriteRepositoryHybrid(remote as any);

    const result = await repo.getAll();

    expect(result).toEqual([{ id: "store-2" }]);
  });

  it("enqueues add/remove and processes queue", async () => {
    const remote = { add: jest.fn().mockResolvedValue(undefined), remove: jest.fn().mockResolvedValue(undefined), list: jest.fn() };
    const repo = new FavoriteRepositoryHybrid(remote as any);
    const store = { id: "store-1" } as any;

    const added = await repo.toggle(store);
    await repo.syncPending();

    const removed = await repo.toggle(store);
    await repo.syncPending();

    expect(added).toBe(true);
    expect(removed).toBe(false);
    expect(remote.add).toHaveBeenCalledWith("store-1");
    expect(remote.remove).toHaveBeenCalledWith("store-1");
  });

  it("checks cached favorite state", async () => {
    await AsyncStorage.setItem("favorites", JSON.stringify([{ id: "store-9" }]));
    const repo = new FavoriteRepositoryHybrid({ list: jest.fn() } as any);

    const result = await repo.isFavorite("store-9");

    expect(result).toBe(true);
  });

  it("stops processing queue on failure", async () => {
    const remote = { add: jest.fn().mockRejectedValue(new Error("fail")), remove: jest.fn() };
    const repo = new FavoriteRepositoryHybrid(remote as any);

    await AsyncStorage.setItem(
      "favorites_queue",
      JSON.stringify([
        { id: "op-1", type: "favorite_add", storeId: "store-1", createdAt: 1 },
        { id: "op-2", type: "favorite_remove", storeId: "store-1", createdAt: 2 }
      ])
    );

    await repo.syncPending();

    expect(remote.add).toHaveBeenCalledWith("store-1");
    expect(remote.remove).not.toHaveBeenCalled();

    const queue = await AsyncStorage.getItem("favorites_queue");
    expect(queue).toEqual(
      JSON.stringify([
        { id: "op-1", type: "favorite_add", storeId: "store-1", createdAt: 1 },
        { id: "op-2", type: "favorite_remove", storeId: "store-1", createdAt: 2 }
      ])
    );
  });
});

describe("ThriftStoreRepositoryJson", () => {
  const makeRemote = () => ({
    getFeatured: jest.fn(),
    getNearby: jest.fn(),
    getFavorites: jest.fn(),
    getById: jest.fn(),
    search: jest.fn(),
    listByCategory: jest.fn(),
    listNearbyPaginated: jest.fn(),
    createStore: jest.fn(),
    updateStore: jest.fn(),
    requestPhotoUploads: jest.fn(),
    confirmPhotos: jest.fn()
  });

  it("returns cached memory data when fresh", async () => {
    const remote = makeRemote();
    const featuredLocal = { getFeatured: jest.fn(), saveFeatured: jest.fn() };
    const repo = new ThriftStoreRepositoryJson(remote as any, featuredLocal as any);
    const nowSpy = jest.spyOn(Date, "now");

    nowSpy.mockReturnValue(1000);
    remote.getFeatured.mockResolvedValueOnce([{ id: "store-1" }]);

    const first = await repo.getFeatured({ lat: 1.234, lng: 2.345 });

    nowSpy.mockReturnValue(1000 + 1000);
    const second = await repo.getFeatured({ lat: 1.234, lng: 2.345 });

    expect(first).toEqual([{ id: "store-1" }]);
    expect(second).toEqual([{ id: "store-1" }]);
    expect(remote.getFeatured).toHaveBeenCalledTimes(1);
    expect(featuredLocal.saveFeatured).toHaveBeenCalledWith("loc_1.23_2.35", {
      data: [{ id: "store-1" }],
      fetchedAt: 1000
    });

    nowSpy.mockRestore();
  });

  it("returns cached local data when fresh", async () => {
    const remote = makeRemote();
    const featuredLocal = {
      getFeatured: jest.fn().mockResolvedValue({ data: [{ id: "store-2" }], fetchedAt: 5000 }),
      saveFeatured: jest.fn()
    };
    const repo = new ThriftStoreRepositoryJson(remote as any, featuredLocal as any);
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(5000 + 1000);

    const result = await repo.getFeatured({ lat: 10, lng: 20 });

    expect(result).toEqual([{ id: "store-2" }]);
    expect(remote.getFeatured).not.toHaveBeenCalled();
    expect(featuredLocal.getFeatured).toHaveBeenCalledWith("loc_10_20");

    nowSpy.mockRestore();
  });

  it("refreshes stale cache in background and calls onUpdated", async () => {
    const remote = makeRemote();
    const featuredLocal = {
      getFeatured: jest.fn().mockResolvedValue({ data: [{ id: "stale" }], fetchedAt: 0 }),
      saveFeatured: jest.fn()
    };
    const repo = new ThriftStoreRepositoryJson(remote as any, featuredLocal as any);
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1000 + 24 * 60 * 60 * 1000 + 1);

    let resolveRemote: (value: any) => void = () => {};
    const remotePromise = new Promise((resolve) => {
      resolveRemote = resolve;
    });
    remote.getFeatured.mockReturnValue(remotePromise);

    const onUpdated = jest.fn();
    const result = await repo.getFeatured({ onUpdated });

    expect(result).toEqual([{ id: "stale" }]);

    resolveRemote([{ id: "fresh" }]);
    await remotePromise;
    await new Promise<void>((resolve) => setImmediate(() => resolve()));

    expect(onUpdated).toHaveBeenCalledWith([{ id: "fresh" }]);

    nowSpy.mockRestore();
  });

  it("forces refresh when requested", async () => {
    const remote = makeRemote();
    remote.getFeatured.mockResolvedValueOnce([{ id: "fresh" }]);
    const featuredLocal = {
      getFeatured: jest.fn().mockResolvedValue({ data: [{ id: "cached" }], fetchedAt: 1000 }),
      saveFeatured: jest.fn()
    };
    const repo = new ThriftStoreRepositoryJson(remote as any, featuredLocal as any);

    const result = await repo.getFeatured({ forceRefresh: true, lat: 1, lng: 2 });

    expect(result).toEqual([{ id: "fresh" }]);
    expect(remote.getFeatured).toHaveBeenCalledTimes(1);
  });

  it("deduplicates inflight fetches for same bucket", async () => {
    const remote = makeRemote();
    let resolveRemote: (value: any) => void = () => {};
    const remotePromise = new Promise((resolve) => {
      resolveRemote = resolve;
    });
    remote.getFeatured.mockReturnValue(remotePromise);
    const repo = new ThriftStoreRepositoryJson(remote as any, undefined);

    const call1 = repo.getFeatured({ lat: 5, lng: 6 });
    const call2 = repo.getFeatured({ lat: 5, lng: 6 });

    resolveRemote([{ id: "store-1" }]);

    const [res1, res2] = await Promise.all([call1, call2]);

    expect(remote.getFeatured).toHaveBeenCalledTimes(1);
    expect(res1).toEqual([{ id: "store-1" }]);
    expect(res2).toEqual([{ id: "store-1" }]);
  });

  it("delegates other repository methods", async () => {
    const remote = makeRemote();
    remote.getNearby.mockResolvedValue({ items: [], page: 1, hasNext: false });
    remote.getFavorites.mockResolvedValue([{ id: "fav" }]);
    remote.getById.mockResolvedValue({ id: "store" });
    remote.search.mockResolvedValue([{ id: "store" }]);
    remote.listByCategory.mockResolvedValue({ items: [], page: 1, hasNext: true });
    remote.listNearbyPaginated.mockResolvedValue({ items: [], page: 2, hasNext: false });
    remote.createStore.mockResolvedValue({ id: "store" });
    remote.updateStore.mockResolvedValue({ id: "store" });
    remote.requestPhotoUploads.mockResolvedValue([{ uploadUrl: "url" }]);
    remote.confirmPhotos.mockResolvedValue({ id: "store" });

    const repo = new ThriftStoreRepositoryJson(remote as any, undefined);

    await repo.getNearby({ page: 1 });
    await repo.getFavorites();
    await repo.getById("store");
    await repo.search("q");
    await repo.listByCategory({ categoryId: "cat" });
    await repo.listNearbyPaginated({ page: 2 });
    await repo.createStore({ name: "Store" } as any);
    await repo.updateStore("store", { name: "Updated" } as any);
    await repo.requestPhotoUploads("store", { count: 1, contentTypes: ["image/png"] });
    await repo.confirmPhotos("store", [{ position: 0 }]);

    expect(remote.getNearby).toHaveBeenCalledWith({ page: 1 });
    expect(remote.getFavorites).toHaveBeenCalledTimes(1);
    expect(remote.getById).toHaveBeenCalledWith("store");
    expect(remote.search).toHaveBeenCalledWith("q");
    expect(remote.listByCategory).toHaveBeenCalledWith({ categoryId: "cat" });
    expect(remote.listNearbyPaginated).toHaveBeenCalledWith({ page: 2 });
    expect(remote.createStore).toHaveBeenCalledWith({ name: "Store" });
    expect(remote.updateStore).toHaveBeenCalledWith("store", { name: "Updated" });
    expect(remote.requestPhotoUploads).toHaveBeenCalledWith("store", { count: 1, contentTypes: ["image/png"] });
    expect(remote.confirmPhotos).toHaveBeenCalledWith("store", [{ position: 0 }], undefined);
  });
});
