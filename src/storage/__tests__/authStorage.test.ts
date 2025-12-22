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
    __reset: () => store.clear()
  };
});

const getAsyncStorageMock = () =>
  jest.requireMock("@react-native-async-storage/async-storage") as {
    __reset: () => void;
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
  };

describe("authStorage", () => {
  beforeEach(() => {
    jest.resetModules();
    getAsyncStorageMock().__reset();
  });

  it("saves tokens and sets cache", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    const { saveTokens, getAccessTokenSync, getRefreshTokenSync } = jest.requireActual("../authStorage");

    await saveTokens("token-1", "refresh-1");

    expect(getAccessTokenSync()).toBe("token-1");
    expect(getRefreshTokenSync()).toBe("refresh-1");
    expect(asyncStorageMock.setItem).toHaveBeenCalledWith("auth.token", "token-1");
    expect(asyncStorageMock.setItem).toHaveBeenCalledWith("auth.refreshToken", "refresh-1");
  });

  it("returns cached tokens without storage reads", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    const { saveTokens, getTokens } = jest.requireActual("../authStorage");

    await saveTokens("token-2", "refresh-2");
    await getTokens();

    expect(asyncStorageMock.getItem).not.toHaveBeenCalled();
  });

  it("loads tokens from storage when cache empty", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    asyncStorageMock.setItem("auth.token", "token-3");
    asyncStorageMock.setItem("auth.refreshToken", "refresh-3");

    const { getTokens, getAccessTokenSync } = jest.requireActual("../authStorage");

    const tokens = await getTokens();

    expect(tokens).toEqual({ token: "token-3", refreshToken: "refresh-3" });
    expect(getAccessTokenSync()).toBe("token-3");
  });

  it("clears tokens and storage", async () => {
    const asyncStorageMock = getAsyncStorageMock();
    const { saveTokens, clearTokens, getAccessTokenSync, getRefreshTokenSync } = jest.requireActual("../authStorage");

    await saveTokens("token-4", "refresh-4");
    await clearTokens();

    expect(getAccessTokenSync()).toBeNull();
    expect(getRefreshTokenSync()).toBeNull();
    expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("auth.token");
    expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("auth.refreshToken");
  });
});
