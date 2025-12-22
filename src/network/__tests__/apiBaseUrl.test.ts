jest.mock("@react-native-async-storage/async-storage", () => {
  let store = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    __reset: () => store.clear()
  };
});

const getAsyncStorageMock = () =>
  jest.requireMock("@react-native-async-storage/async-storage") as {
    __reset: () => void;
    getItem: jest.Mock;
    setItem: jest.Mock;
  };

describe("apiBaseUrl", () => {
  beforeEach(() => {
    jest.resetModules();
    (global as any).__DEV__ = true;
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com";
    getAsyncStorageMock().__reset();
  });

  it("returns default base URL when no override", async () => {
    const { getApiBaseUrlSync, getApiBaseUrl } = jest.requireActual("../apiBaseUrl");

    expect(getApiBaseUrlSync()).toBe("https://api.example.com");
    await expect(getApiBaseUrl()).resolves.toBe("https://api.example.com");
  });

  it("loads override in dev and normalizes", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    await asyncStorageMock.setItem("debug_api_base_url_override", "https://api.override.com/");

    const { ensureDebugApiBaseUrlLoaded, getApiBaseUrlSync } = jest.requireActual("../apiBaseUrl");

    await ensureDebugApiBaseUrlLoaded();
    expect(getApiBaseUrlSync()).toBe("https://api.override.com");
  });

  it("ignores invalid stored override", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    await asyncStorageMock.setItem("debug_api_base_url_override", "ftp://invalid");

    const { ensureDebugApiBaseUrlLoaded, getApiBaseUrlSync } = jest.requireActual("../apiBaseUrl");

    await ensureDebugApiBaseUrlLoaded();
    expect(getApiBaseUrlSync()).toBe("https://api.example.com");
  });

  it("sets and persists debug override", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    const { setDebugApiBaseUrlOverride, getApiBaseUrlSync } = jest.requireActual("../apiBaseUrl");

    const result = await setDebugApiBaseUrlOverride("https://debug.local/");

    expect(result).toEqual({ changed: true, next: "https://debug.local" });
    expect(getApiBaseUrlSync()).toBe("https://debug.local");
    expect(asyncStorageMock.setItem).toHaveBeenCalledWith("debug_api_base_url_override", "https://debug.local");
  });

  it("throws when invalid override is set", async () => {
    const { setDebugApiBaseUrlOverride } = jest.requireActual("../apiBaseUrl");

    await expect(setDebugApiBaseUrlOverride("not-a-url")).rejects.toThrow("invalid_url");
  });

  it("no-ops when not in dev", async () => {
    (global as any).__DEV__ = false;

    const { ensureDebugApiBaseUrlLoaded, getApiBaseUrlSync } = jest.requireActual("../apiBaseUrl");

    await ensureDebugApiBaseUrlLoaded();
    expect(getApiBaseUrlSync()).toBe("https://api.example.com");
  });
});
