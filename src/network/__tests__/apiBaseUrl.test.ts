import urls from "../../../constants/urls.json";

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

const originalNodeEnv = process.env.NODE_ENV;
const originalDevFlag = (global as any).__DEV__;

const resetModulesWithEnv = (nodeEnv: string, devFlag?: boolean) => {
  process.env.NODE_ENV = nodeEnv;
  if (typeof devFlag === "boolean") {
    (global as any).__DEV__ = devFlag;
  }
  jest.resetModules();
  getAsyncStorageMock().__reset();
};

describe("apiBaseUrl", () => {
  beforeEach(() => {
    resetModulesWithEnv("test");
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (typeof originalDevFlag === "boolean") {
      (global as any).__DEV__ = originalDevFlag;
    } else if ("__DEV__" in global) {
      try {
        delete (global as any).__DEV__;
      } catch {
        (global as any).__DEV__ = undefined;
      }
    }
  });

  it("returns default base URL when no override", async () => {
    const { getApiBaseUrlSync, getApiBaseUrl } = jest.requireActual("../apiBaseUrl");

    const expected = urls.devApiBaseUrl.replace(/\/$/, "");
    expect(getApiBaseUrlSync()).toBe(expected);
    await expect(getApiBaseUrl()).resolves.toBe(expected);
  });

  it("loads override when base URL is non-prod and normalizes", async () => {
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
    expect(getApiBaseUrlSync()).toBe(urls.devApiBaseUrl.replace(/\/$/, ""));
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

  it("no-ops when base URL is production", async () => {
    resetModulesWithEnv("production", false);
    const asyncStorageMock = getAsyncStorageMock();
    await asyncStorageMock.setItem("debug_api_base_url_override", "https://api.override.com/");

    const { ensureDebugApiBaseUrlLoaded, getApiBaseUrlSync } = jest.requireActual("../apiBaseUrl");

    await ensureDebugApiBaseUrlLoaded();
    expect(getApiBaseUrlSync()).toBe(urls.prodApiBaseUrl.replace(/\/$/, ""));
  });
});
