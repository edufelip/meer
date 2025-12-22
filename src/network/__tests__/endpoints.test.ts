import { endpoints } from "../endpoints";

describe("endpoints", () => {
  it("builds thrift store endpoints", () => {
    expect(endpoints.thriftStores.list()).toBe("/thrift-stores");
    expect(endpoints.thriftStores.detail("abc")).toBe("/thrift-stores/abc");
    expect(endpoints.thriftStores.search("vintage & rare")).toBe(
      "/thrift-stores/search?q=vintage%20%26%20rare"
    );
  });

  it("builds article endpoints", () => {
    expect(endpoints.articles.listByStore("store-1")).toBe("/stores/store-1/articles");
    expect(endpoints.articles.detail("art-1")).toBe("/articles/art-1");
    expect(endpoints.articles.create("store-2")).toBe("/stores/store-2/articles");
    expect(endpoints.articles.update("art-2")).toBe("/articles/art-2");
    expect(endpoints.articles.delete("art-3")).toBe("/articles/art-3");
  });

  it("builds auth endpoints", () => {
    expect(endpoints.auth.login()).toBe("/auth/login");
    expect(endpoints.auth.signup()).toBe("/auth/signup");
    expect(endpoints.auth.refresh()).toBe("/auth/refresh");
  });
});
