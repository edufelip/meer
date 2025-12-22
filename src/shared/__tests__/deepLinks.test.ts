const loadDeepLinks = () => jest.requireActual("../deepLinks");

const mockCreateURL = jest.fn((path: string) => `app:///${path}`);

jest.mock("expo-linking", () => ({
  createURL: (path: string) => mockCreateURL(path)
}));

describe("deepLinks", () => {
  const originalEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL;

  beforeEach(() => {
    jest.resetModules();
    mockCreateURL.mockClear();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_WEB_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_WEB_BASE_URL = originalEnv;
    }
  });

  it("builds store paths with encoding", () => {
    const { buildThriftStorePath } = loadDeepLinks();
    expect(buildThriftStorePath("abc/123")).toBe("store/abc%2F123");
  });

  it("returns null for invalid web base url", () => {
    process.env.EXPO_PUBLIC_WEB_BASE_URL = "ftp://example.com";
    const { getWebBaseUrl } = loadDeepLinks();
    expect(getWebBaseUrl()).toBeNull();
  });

  it("uses web base url when configured", () => {
    process.env.EXPO_PUBLIC_WEB_BASE_URL = "https://example.com/";
    const { buildThriftStoreShareUrl } = loadDeepLinks();
    expect(buildThriftStoreShareUrl("store-1")).toBe("https://example.com/store/store-1");
  });

  it("falls back to linking createURL when no base url", () => {
    delete process.env.EXPO_PUBLIC_WEB_BASE_URL;
    const { buildThriftStoreShareUrl } = loadDeepLinks();
    expect(buildThriftStoreShareUrl("s1")).toBe("app:///store/s1");
    expect(mockCreateURL).toHaveBeenCalledWith("store/s1");
  });
});
