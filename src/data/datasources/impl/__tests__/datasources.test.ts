import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageCategoryLocalDataSource } from "../AsyncStorageCategoryLocalDataSource";
import { AsyncStorageFeaturedLocalDataSource } from "../AsyncStorageFeaturedLocalDataSource";
import { AsyncStorageProfileLocalDataSource, PROFILE_KEY } from "../AsyncStorageProfileLocalDataSource";
import { AsyncStorageUserLocalDataSource } from "../AsyncStorageUserLocalDataSource";
import { clearHomeCache, loadHomeCache, saveHomeCache } from "../AsyncStorageHomeCache";
import { loadFromJson, saveToJson } from "../LocalJsonClient";
import { HttpCategoryRemoteDataSource } from "../HttpCategoryRemoteDataSource";
import { HttpFavoriteRemoteDataSource } from "../HttpFavoriteRemoteDataSource";
import { HttpFeedbackRemoteDataSource } from "../HttpFeedbackRemoteDataSource";
import { HttpGuideContentRemoteDataSource } from "../HttpGuideContentRemoteDataSource";
import { HttpProfileRemoteDataSource } from "../HttpProfileRemoteDataSource";
import { HttpSupportRemoteDataSource } from "../HttpSupportRemoteDataSource";
import { HttpThriftStoreRemoteDataSource } from "../HttpThriftStoreRemoteDataSource";
import { api } from "../../../../api/client";

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

jest.mock("../../../../api/client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

const asyncStorageMock = AsyncStorage as unknown as { __reset: () => void; getItem: jest.Mock; setItem: jest.Mock; removeItem: jest.Mock };
const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

beforeEach(() => {
  asyncStorageMock.__reset();
  jest.clearAllMocks();
});

describe("AsyncStorage local data sources", () => {
  it("stores and retrieves categories", async () => {
    const ds = new AsyncStorageCategoryLocalDataSource();
    await ds.saveCategories([{ id: "cat-1" } as any]);

    const result = await ds.getCategories();

    expect(result).toEqual([{ id: "cat-1" }]);
  });

  it("returns null for invalid categories cache", async () => {
    const ds = new AsyncStorageCategoryLocalDataSource();
    await AsyncStorage.setItem("CATEGORIES_CACHE", "bad-json");

    const result = await ds.getCategories();

    expect(result).toBeNull();
  });

  it("clears categories cache", async () => {
    const ds = new AsyncStorageCategoryLocalDataSource();
    await ds.saveCategories([{ id: "cat-1" } as any]);

    await ds.clear();

    const result = await ds.getCategories();
    expect(result).toBeNull();
  });

  it("stores and retrieves featured cache", async () => {
    const ds = new AsyncStorageFeaturedLocalDataSource();
    await ds.saveFeatured("bucket", {
      data: [
        {
          id: "store-1",
          name: "Store",
          tagline: "tag",
          coverImageUrl: "cover",
          addressLine: "addr",
          openingHours: "hours",
          categories: []
        }
      ],
      fetchedAt: 1
    });

    const result = await ds.getFeatured("bucket");

    expect(result).toEqual({
      data: [
        {
          id: "store-1",
          name: "Store",
          tagline: "tag",
          coverImageUrl: "cover",
          addressLine: "addr",
          openingHours: "hours",
          categories: []
        }
      ],
      fetchedAt: 1
    });
  });

  it("returns null for invalid featured cache and clears it", async () => {
    const ds = new AsyncStorageFeaturedLocalDataSource();
    await AsyncStorage.setItem("featured-cache:bucket", "bad-json");

    const result = await ds.getFeatured("bucket");
    await ds.clearFeatured("bucket");
    const afterClear = await ds.getFeatured("bucket");

    expect(result).toBeNull();
    expect(afterClear).toBeNull();
  });

  it("stores and retrieves profile cache with defaults", async () => {
    const ds = new AsyncStorageProfileLocalDataSource();
    await ds.saveProfile({ id: 123, notifyNewStores: true, notifyPromos: false } as any);

    const result = await ds.getProfile();

    expect(result).toEqual({ id: "123", notifyNewStores: true, notifyPromos: false });
  });

  it("returns null when profile cache is invalid", async () => {
    const ds = new AsyncStorageProfileLocalDataSource();
    await AsyncStorage.setItem(PROFILE_KEY, "bad-json");

    const result = await ds.getProfile();

    expect(result).toBeNull();
  });

  it("clears profile cache", async () => {
    const ds = new AsyncStorageProfileLocalDataSource();
    await ds.saveProfile({ id: "user-1", notifyNewStores: false, notifyPromos: false } as any);

    await ds.clearProfile();
    const result = await ds.getProfile();

    expect(result).toBeNull();
  });

  it("returns null when user cache is missing", async () => {
    const ds = new AsyncStorageUserLocalDataSource();

    const result = await ds.getCurrentUser();

    expect(result).toBeNull();
  });

  it("returns user when cache exists", async () => {
    const ds = new AsyncStorageUserLocalDataSource();
    await AsyncStorage.setItem("CURRENT_USER_KEY", JSON.stringify({ id: "user-1" }));

    const result = await ds.getCurrentUser();

    expect(result).toEqual({ id: "user-1" });
  });

  it("loads and clears home cache", async () => {
    await saveHomeCache("bucket", { featured: [], nearby: [], contents: [], fetchedAt: 10 });

    const loaded = await loadHomeCache("bucket");
    await clearHomeCache("bucket");
    const afterClear = await loadHomeCache("bucket");

    expect(loaded).toEqual({ featured: [], nearby: [], contents: [], fetchedAt: 10 });
    expect(afterClear).toBeNull();
  });

  it("returns null for invalid home cache", async () => {
    await AsyncStorage.setItem("home-cache:bucket", "bad-json");

    const loaded = await loadHomeCache("bucket");

    expect(loaded).toBeNull();
  });
});

describe("LocalJsonClient", () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    randomSpy.mockRestore();
  });

  it("loads payload with a clone", async () => {
    const payload = { nested: { value: 1 } };

    const promise = loadFromJson<typeof payload>(payload);
    jest.runAllTimers();
    const result = await promise;

    expect(result).toEqual(payload);
    expect(result).not.toBe(payload);
  });

  it("saves payload without error", async () => {
    const promise = saveToJson("file.json", { value: 2 });
    jest.runAllTimers();

    await expect(promise).resolves.toBeUndefined();
  });
});

describe("HttpCategoryRemoteDataSource", () => {
  it("fetches categories", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "cat-1" }] });
    const ds = new HttpCategoryRemoteDataSource();

    const result = await ds.list();

    expect(apiMock.get).toHaveBeenCalledWith("/categories");
    expect(result).toEqual([{ id: "cat-1" }]);
  });
});

describe("HttpGuideContentRemoteDataSource", () => {
  it("maps list params and delegates other calls", async () => {
    apiMock.get.mockResolvedValue({ data: { items: [], page: 0, hasNext: false } });
    apiMock.post.mockResolvedValue({ data: { id: "content-1" } });

    const ds = new HttpGuideContentRemoteDataSource();
    await ds.listLatest({ q: " Test ", sort: "newest", page: 2, pageSize: 5, storeId: "store" });
    await ds.createContent({ title: "Title", storeId: "store" });
    await ds.updateContent("content-1", { title: "Updated" });
    await ds.requestImageUpload("content-1", "image/png");
    await ds.requestImageUpload("content-1");
    await ds.deleteContent("content-1");

    expect(apiMock.get).toHaveBeenCalledWith("/contents", {
      params: { q: "Test", sort: "newest", page: 2, pageSize: 5, storeId: "store" }
    });
    expect(apiMock.post).toHaveBeenCalledWith("/contents", { title: "Title", storeId: "store" });
    expect(apiMock.put).toHaveBeenCalledWith("/contents/content-1", { title: "Updated" });
    expect(apiMock.post).toHaveBeenCalledWith("/contents/content-1/image/upload", { contentType: "image/png" });
    expect(apiMock.post).toHaveBeenCalledWith("/contents/content-1/image/upload", {});
    expect(apiMock.delete).toHaveBeenCalledWith("/contents/content-1");
  });
});

describe("HttpProfileRemoteDataSource", () => {
  it("normalizes profile payload and delegates updates", async () => {
    apiMock.get.mockResolvedValue({ data: { user: { id: 99 } } });
    apiMock.patch.mockResolvedValue({ data: { id: "99", notifyNewStores: true, notifyPromos: false } });
    apiMock.post.mockResolvedValue({ data: { uploadUrl: "url", fileKey: "key", contentType: "image/png" } });

    const ds = new HttpProfileRemoteDataSource();

    const profile = await ds.getProfile();
    const updated = await ds.updateProfile({ bio: "hi" });
    await ds.deleteAccount("user@example.com");
    const upload = await ds.requestAvatarUploadSlot("image/png");
    await ds.requestAvatarUploadSlot();

    expect(profile).toEqual({ id: "99", notifyNewStores: false, notifyPromos: false });
    expect(apiMock.patch).toHaveBeenCalledWith(
      "/profile",
      { bio: "hi" },
      { headers: { "Content-Type": "application/json" } }
    );
    expect(updated).toEqual({ id: "99", notifyNewStores: true, notifyPromos: false });
    expect(apiMock.delete).toHaveBeenCalledWith("/account", { data: { email: "user@example.com" } });
    expect(apiMock.post).toHaveBeenCalledWith(
      "/profile/avatar/upload",
      { contentType: "image/png" },
      { headers: { "Content-Type": "application/json" } }
    );
    expect(apiMock.post).toHaveBeenCalledWith(
      "/profile/avatar/upload",
      {},
      { headers: { "Content-Type": "application/json" } }
    );
    expect(upload).toEqual({ uploadUrl: "url", fileKey: "key", contentType: "image/png" });
  });
});

describe("HttpSupportRemoteDataSource", () => {
  it("posts support message", async () => {
    apiMock.post.mockResolvedValue({ data: {} });
    const ds = new HttpSupportRemoteDataSource();

    await ds.sendMessage({ message: "help" } as any);

    expect(apiMock.post).toHaveBeenCalledWith("/support/contact", { message: "help" });
  });
});

describe("HttpFavoriteRemoteDataSource", () => {
  it("manages favorites", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "store-1" }] });
    const ds = new HttpFavoriteRemoteDataSource();

    const list = await ds.list();
    await ds.add("store-1");
    await ds.remove("store-1");

    expect(list).toEqual([{ id: "store-1" }]);
    expect(apiMock.get).toHaveBeenCalledWith("/favorites");
    expect(apiMock.post).toHaveBeenCalledWith("/favorites/store-1");
    expect(apiMock.delete).toHaveBeenCalledWith("/favorites/store-1");
  });
});

describe("HttpFeedbackRemoteDataSource", () => {
  it("returns feedback when available", async () => {
    apiMock.get.mockResolvedValue({ data: { id: "feedback-1" } });
    const ds = new HttpFeedbackRemoteDataSource();

    const result = await ds.getMine("store-1");

    expect(result).toEqual({ id: "feedback-1" });
  });

  it("returns null on 404", async () => {
    apiMock.get.mockRejectedValue({ response: { status: 404 } });
    const ds = new HttpFeedbackRemoteDataSource();

    const result = await ds.getMine("store-1");

    expect(result).toBeNull();
  });

  it("throws on non-404 errors", async () => {
    const error = new Error("boom");
    apiMock.get.mockRejectedValue(error);
    const ds = new HttpFeedbackRemoteDataSource();

    await expect(ds.getMine("store-1")).rejects.toBe(error);
  });

  it("posts feedback and deletes", async () => {
    apiMock.post.mockResolvedValue({ data: {} });
    apiMock.delete.mockResolvedValue({ data: {} });
    const ds = new HttpFeedbackRemoteDataSource();

    await ds.upsert({ storeId: "store-1", score: 4, body: "ok" } as any);
    await ds.delete("store-1");

    expect(apiMock.post).toHaveBeenCalledWith("/stores/store-1/feedback", { score: 4, body: "ok" });
    expect(apiMock.delete).toHaveBeenCalledWith("/stores/store-1/feedback");
  });

  it("lists store ratings with pagination", async () => {
    apiMock.get.mockResolvedValue({ data: { items: [], page: 1, hasNext: false } });
    const ds = new HttpFeedbackRemoteDataSource();

    const result = await ds.listStoreRatings({ storeId: "store-1", page: 2, pageSize: 5 });

    expect(apiMock.get).toHaveBeenCalledWith("/stores/store-1/ratings", {
      params: { page: 2, pageSize: 5 }
    });
    expect(result).toEqual({ items: [], page: 1, hasNext: false });
  });
});

describe("HttpThriftStoreRemoteDataSource", () => {
  it("maps featured stores and badge labels", async () => {
    apiMock.get.mockResolvedValue({
      data: [
        {
          id: "store-1",
          badge_label: "most_loved",
          my_rating: 4,
          name: "Store",
          tagline: "tag",
          coverImageUrl: "img",
          addressLine: "addr",
          openingHours: "hours",
          categories: []
        }
      ]
    });
    const ds = new HttpThriftStoreRemoteDataSource();

    const result = await ds.getFeatured({});

    expect(result[0].badgeLabel).toBe("Mais amado");
    expect(result[0].badge).toBe("most_loved");
    expect(result[0].myRating).toBe(4);
  });

  it("humanizes unknown badge and uses myRating when provided", async () => {
    apiMock.get.mockResolvedValue({
      data: [
        {
          id: "store-2",
          badge_label: "top_pick",
          myRating: 5,
          name: "Store",
          tagline: "tag",
          coverImageUrl: "img",
          addressLine: "addr",
          openingHours: "hours",
          categories: []
        }
      ]
    });
    const ds = new HttpThriftStoreRemoteDataSource();

    const result = await ds.getFeatured({});

    expect(result[0].badgeLabel).toBe("Top Pick");
    expect(result[0].myRating).toBe(5);
  });

  it("gets store by id", async () => {
    apiMock.get.mockResolvedValue({
      data: {
        id: "store-1",
        name: "Store",
        tagline: "tag",
        coverImageUrl: "img",
        addressLine: "addr",
        openingHours: "hours",
        categories: []
      }
    });
    const ds = new HttpThriftStoreRemoteDataSource();

    const result = await ds.getById("store-1");

    expect(result?.id).toBe("store-1");
  });

  it("returns null when store not found", async () => {
    apiMock.get.mockResolvedValue({ data: null });
    const ds = new HttpThriftStoreRemoteDataSource();

    const result = await ds.getById("missing");

    expect(result).toBeNull();
  });

  it("builds params for nearby and list pages", async () => {
    apiMock.get.mockResolvedValue({ data: { items: [], page: 1, hasNext: false } });
    const ds = new HttpThriftStoreRemoteDataSource();

    await ds.getNearby({ page: 2, pageSize: 5, lat: 1, lng: 2 });
    await ds.listNearbyPaginated({ page: 1, pageSize: 10, lat: 1, lng: 2 });

    expect(apiMock.get).toHaveBeenCalledWith("/nearby", {
      params: { lat: 1, lng: 2, pageIndex: 1, pageSize: 5 }
    });
    expect(apiMock.get).toHaveBeenCalledWith("/nearby", {
      params: { pageIndex: 0, pageSize: 10, lat: 1, lng: 2 }
    });
  });

  it("handles favorites, search, and uploads", async () => {
    apiMock.get.mockResolvedValueOnce({ data: [] });
    apiMock.get.mockResolvedValueOnce({ data: { items: [] } });
    apiMock.get.mockResolvedValueOnce({ data: [] });
    apiMock.post.mockResolvedValueOnce({ data: { uploads: [{ uploadUrl: "url" }] } });
    apiMock.put.mockResolvedValueOnce({ data: { id: "store-1" } });

    const ds = new HttpThriftStoreRemoteDataSource();

    await ds.getFavorites();
    await ds.search("query");
    await ds.search("query-array");
    const uploads = await ds.requestPhotoUploads("store-1", { count: 1, contentTypes: ["image/png"] });
    await ds.confirmPhotos("store-1", [{ position: 0 }]);

    expect(uploads).toEqual([{ uploadUrl: "url" }]);
    expect(apiMock.post).toHaveBeenCalledWith("/stores/store-1/photos/uploads", {
      count: 1,
      contentTypes: ["image/png"]
    });
    expect(apiMock.put).toHaveBeenCalledWith("/stores/store-1/photos", {
      photos: [{ position: 0 }],
      deletePhotoIds: undefined
    });
  });

  it("maps listByCategory and create/update", async () => {
    apiMock.get.mockResolvedValue({ data: { items: [], page: 1, hasNext: false } });
    apiMock.post.mockResolvedValue({ data: { id: "store-1" } });
    apiMock.put.mockResolvedValue({ data: { id: "store-1" } });

    const ds = new HttpThriftStoreRemoteDataSource();
    await ds.listByCategory({ categoryId: "cat-1", page: 2, pageSize: 5 });
    await ds.createStore({ name: "Store" } as any);
    await ds.updateStore("store-1", { name: "Updated" } as any);

    expect(apiMock.get).toHaveBeenCalledWith("/stores", {
      params: { categoryId: "cat-1", page: 2, pageSize: 5 }
    });
    expect(apiMock.post).toHaveBeenCalledWith("/stores", { name: "Store" });
    expect(apiMock.put).toHaveBeenCalledWith("/stores/store-1", { name: "Updated" });
  });
});
