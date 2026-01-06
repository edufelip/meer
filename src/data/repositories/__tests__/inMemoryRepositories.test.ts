import { InMemoryCategoryRepository } from "../InMemoryCategoryRepository";
import { InMemoryGuideContentRepository } from "../InMemoryGuideContentRepository";
import { InMemoryThriftStoreRepository } from "../InMemoryThriftStoreRepository";

describe("InMemoryCategoryRepository", () => {
  it("returns static categories", async () => {
    const repo = new InMemoryCategoryRepository();

    const result = await repo.list();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
  });
});

describe("InMemoryGuideContentRepository", () => {
  it("filters and paginates guide content", async () => {
    const repo = new InMemoryGuideContentRepository();

    const page = await repo.listLatest({ q: "garimpo", page: 0, pageSize: 1, sort: "newest" });

    expect(page.items.length).toBe(1);
    expect(page.items[0].title.toLowerCase()).toContain("garimpo");
    expect(page.hasNext).toBe(false);
  });

  it("filters by storeId and sorts oldest", async () => {
    const repo = new InMemoryGuideContentRepository();

    const page = await repo.listLatest({ storeId: "demo-store", sort: "oldest" });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items[0].createdAt).toBeDefined();
  });

  it("gets content by id", async () => {
    const repo = new InMemoryGuideContentRepository();

    const item = await repo.getById("garimpo-sucesso");

    expect(item?.id).toBe("garimpo-sucesso");
  });
});

describe("InMemoryThriftStoreRepository", () => {
  it("gets store by id and searches", async () => {
    const repo = new InMemoryThriftStoreRepository();

    const store = await repo.getById("vintage-vibes");
    const search = await repo.search("vintage");
    const featured = await repo.getFeatured();
    const nearby = await repo.getNearby();
    const favorites = await repo.getFavorites();
    const byCategory = await repo.listByCategory();

    expect(store?.id).toBe("vintage-vibes");
    expect(search.length).toBeGreaterThan(0);
    expect(featured.length).toBeGreaterThan(0);
    expect(nearby.items.length).toBeGreaterThan(0);
    expect(favorites.length).toBeGreaterThan(0);
    expect(byCategory.items).toEqual([]);
  });

  it("returns nearby list", async () => {
    const repo = new InMemoryThriftStoreRepository();

    const page = await repo.listNearbyPaginated();

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.page).toBe(1);
  });

  it("throws for unsupported create/update", async () => {
    const repo = new InMemoryThriftStoreRepository();

    await expect(repo.createStore()).rejects.toThrow("InMemory repository does not support createStore");
    await expect(repo.updateStore()).rejects.toThrow("InMemory repository does not support updateStore");
  });
});
