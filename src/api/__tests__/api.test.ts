import { api } from "../client";
import { createArticle, deleteArticle, getArticle, listArticlesByStore, updateArticle } from "../articles";
import { getStore, listFeaturedStores, searchStores } from "../stores";
import { login, loginWithApple, loginWithGoogle, signup, validateToken } from "../auth";

jest.mock("../client", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

describe("api modules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles auth calls", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { token: "t" } });
    apiMock.post.mockResolvedValueOnce({ data: { token: "s" } });
    apiMock.post.mockResolvedValueOnce({ data: { token: "g" } });
    apiMock.post.mockResolvedValueOnce({ data: { token: "a" } });

    await login({ email: "user@example.com", password: "pw" });
    await signup({ name: "User", email: "user@example.com", password: "pw" });
    await loginWithGoogle({ provider: "google", client: "web", idToken: "id" });
    await loginWithApple({ provider: "apple", client: "ios", authorizationCode: "code" });

    expect(apiMock.post).toHaveBeenCalledWith("/auth/login", { email: "user@example.com", password: "pw" });
    expect(apiMock.post).toHaveBeenCalledWith("/auth/signup", { name: "User", email: "user@example.com", password: "pw" });
    expect(apiMock.post).toHaveBeenCalledWith("/auth/google", { provider: "google", client: "web", idToken: "id" });
    expect(apiMock.post).toHaveBeenCalledWith("/auth/apple", { provider: "apple", client: "ios", authorizationCode: "code" });
  });

  it("normalizes validateToken payloads", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { user: { id: 123, notifyNewStores: true } } });
    const profile1 = await validateToken();
    expect(profile1).toEqual({ id: "123", notifyNewStores: true, notifyPromos: false });

    apiMock.get.mockResolvedValueOnce({ data: { id: "999", notifyPromos: true, notifyNewStores: false } });
    const profile2 = await validateToken();
    expect(profile2).toEqual({ id: "999", notifyPromos: true, notifyNewStores: false });
  });

  it("handles article endpoints", async () => {
    apiMock.get.mockResolvedValueOnce({ data: [{ id: "a1" }] });
    apiMock.get.mockResolvedValueOnce({ data: { id: "a2" } });
    apiMock.post.mockResolvedValueOnce({ data: { id: "a3" } });
    apiMock.put.mockResolvedValueOnce({ data: { id: "a4" } });

    await listArticlesByStore("store-1");
    await getArticle("a2");
    await createArticle("store-1", { title: "New" });
    await updateArticle("a4", { title: "Updated" });
    await deleteArticle("a5");

    expect(apiMock.get).toHaveBeenCalledWith("/stores/store-1/articles");
    expect(apiMock.get).toHaveBeenCalledWith("/articles/a2");
    expect(apiMock.post).toHaveBeenCalledWith("/stores/store-1/articles", { title: "New" });
    expect(apiMock.put).toHaveBeenCalledWith("/articles/a4", { title: "Updated" });
    expect(apiMock.delete).toHaveBeenCalledWith("/articles/a5");
  });

  it("handles store endpoints", async () => {
    apiMock.get.mockResolvedValueOnce({ data: [{ id: "s1" }] });
    apiMock.get.mockResolvedValueOnce({ data: [{ id: "s2" }] });
    apiMock.get.mockResolvedValueOnce({ data: { id: "s3" } });

    await listFeaturedStores();
    await searchStores("vintage & rare");
    await getStore("s3");

    expect(apiMock.get).toHaveBeenCalledWith("/thrift-stores");
    expect(apiMock.get).toHaveBeenCalledWith("/thrift-stores/search?q=vintage%20%26%20rare");
    expect(apiMock.get).toHaveBeenCalledWith("/thrift-stores/s3");
  });
});
