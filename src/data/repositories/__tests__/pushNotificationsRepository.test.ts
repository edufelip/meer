import { PushNotificationsRepositoryImpl } from "../PushNotificationsRepositoryImpl";

const mockMessagingInstance = {};
const mockSubscribeToTopic = jest.fn();
const mockUnsubscribeFromTopic = jest.fn();
const mockRequestPermission = jest.fn();
const mockRegisterDeviceForRemoteMessages = jest.fn();
const mockGetToken = jest.fn();
const mockOnTokenRefresh = jest.fn();
const mockOnNotificationOpenedApp = jest.fn();
const mockGetInitialNotification = jest.fn();

jest.mock("@react-native-firebase/messaging", () => {
  const mockMessagingInstance = {};
  return {
    __esModule: true,
    getMessaging: jest.fn(() => mockMessagingInstance),
    subscribeToTopic: jest.fn((_m, ...args) => mockSubscribeToTopic(...args)),
    unsubscribeFromTopic: jest.fn((_m, ...args) => mockUnsubscribeFromTopic(...args)),
    requestPermission: jest.fn((_m, ...args) => mockRequestPermission(...args)),
    registerDeviceForRemoteMessages: jest.fn((_m, ...args) => mockRegisterDeviceForRemoteMessages(...args)),
    getToken: jest.fn((_m, ...args) => mockGetToken(...args)),
    onTokenRefresh: jest.fn((_m, ...args) => mockOnTokenRefresh(...args)),
    onNotificationOpenedApp: jest.fn((_m, ...args) => mockOnNotificationOpenedApp(...args)),
    getInitialNotification: jest.fn((_m, ...args) => mockGetInitialNotification(...args)),
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 }
  };
});

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 })
  },
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 }
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "device-1")
}));

describe("PushNotificationsRepositoryImpl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildLocal = () => {
    let deviceId: string | null = null;
    let lastToken: string | null = null;
    let lastEnv: string | null = null;

    return {
      getDeviceId: jest.fn(async () => deviceId),
      setDeviceId: jest.fn(async (id: string) => {
        deviceId = id;
      }),
      getLastToken: jest.fn(async () => lastToken),
      setLastToken: jest.fn(async (token: string | null) => {
        lastToken = token;
      }),
      getLastEnvironment: jest.fn(async () => lastEnv),
      setLastEnvironment: jest.fn(async (env: string | null) => {
        lastEnv = env;
      })
    };
  };

  it("registers token and stores device id + environment", async () => {
    const remote = { registerToken: jest.fn().mockResolvedValue(undefined), unregisterToken: jest.fn() };
    const local = buildLocal();
    const repo = new PushNotificationsRepositoryImpl(remote as any, local as any);

    await repo.registerToken({
      fcmToken: "token-1",
      platform: "ios",
      environment: "dev",
      appVersion: "1.0.0"
    });

    expect(local.setDeviceId).toHaveBeenCalledWith("device-1");
    expect(remote.registerToken).toHaveBeenCalledWith({
      fcmToken: "token-1",
      platform: "ios",
      environment: "dev",
      appVersion: "1.0.0",
      deviceId: "device-1"
    });
    expect(local.setLastToken).toHaveBeenCalledWith("token-1");
    expect(local.setLastEnvironment).toHaveBeenCalledWith("dev");
  });

  it("returns last environment when known", async () => {
    const remote = { registerToken: jest.fn(), unregisterToken: jest.fn() };
    const local = buildLocal();
    const repo = new PushNotificationsRepositoryImpl(remote as any, local as any);

    await local.setLastEnvironment("staging");
    const env = await repo.getLastEnvironment();

    expect(env).toBe("staging");
  });

  it("returns null for unknown environment", async () => {
    const remote = { registerToken: jest.fn(), unregisterToken: jest.fn() };
    const local = buildLocal();
    const repo = new PushNotificationsRepositoryImpl(remote as any, local as any);

    await local.setLastEnvironment("qa");
    const env = await repo.getLastEnvironment();

    expect(env).toBeNull();
  });

  it("syncs topics even when one fails", async () => {
    const remote = { registerToken: jest.fn(), unregisterToken: jest.fn() };
    const local = buildLocal();
    const repo = new PushNotificationsRepositoryImpl(remote as any, local as any);

    mockSubscribeToTopic.mockRejectedValueOnce(new Error("fail promos"));
    mockUnsubscribeFromTopic.mockResolvedValueOnce(undefined);

    await expect(
      repo.syncTopicSubscriptions({ notifyPromos: true, notifyNewStores: false, environment: "dev" })
    ).resolves.toBeUndefined();

    expect(mockSubscribeToTopic).toHaveBeenCalledWith("promos-dev");
    expect(mockUnsubscribeFromTopic).toHaveBeenCalledWith("new_stores-dev");
  });

  it("clears stored env on unregister", async () => {
    const remote = { registerToken: jest.fn(), unregisterToken: jest.fn().mockResolvedValue(undefined) };
    const local = buildLocal();
    const repo = new PushNotificationsRepositoryImpl(remote as any, local as any);

    await local.setDeviceId("device-1");
    await local.setLastEnvironment("prod");

    await repo.unregisterToken("prod");

    expect(remote.unregisterToken).toHaveBeenCalledWith("device-1", "prod");
    expect(local.setLastEnvironment).toHaveBeenCalledWith(null);
  });
});
