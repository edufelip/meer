const loadLinking = () => jest.requireActual("../linking");

const mockCreateURL = jest.fn((path: string) => `app:///${String(path).replace(/^\/?/, "")}`);

jest.mock("expo-linking", () => ({
  createURL: (path: string) => mockCreateURL(path)
}));

describe("linking", () => {
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

  it("includes default prefixes when no web base url", () => {
    delete process.env.EXPO_PUBLIC_WEB_BASE_URL;
    const { linking } = loadLinking();
    expect(linking.prefixes).toEqual(["app:///", "meer://", "exp+meer://"]);
    expect(mockCreateURL).toHaveBeenCalledWith("/");
  });

  it("adds the web base url prefix when configured", () => {
    process.env.EXPO_PUBLIC_WEB_BASE_URL = "https://example.com/";
    const { linking } = loadLinking();
    expect(linking.prefixes).toContain("https://example.com");
  });
});
