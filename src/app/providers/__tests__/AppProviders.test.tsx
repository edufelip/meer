import React from "react";
import { AppState, Text } from "react-native";
import { act, render, waitFor } from "@testing-library/react-native";
import { AppProviders } from "../AppProviders";
import { useValidateToken } from "../../../hooks/useValidateToken";
const flushPromises = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockGetTokens = jest.fn();
const mockClearAuthSession = jest.fn();
const mockPrimeApiToken = jest.fn();
const mockNavigationReset = jest.fn();
const mockNavigationNavigate = jest.fn();

const mockDeps = {
  getCachedProfileUseCase: { execute: jest.fn().mockResolvedValue({ id: "user-1" }) },
  favoriteRepository: { syncPending: jest.fn() },
  requestPushPermissionUseCase: { execute: jest.fn().mockResolvedValue(false) },
  getPushTokenUseCase: { execute: jest.fn().mockResolvedValue("push-token") },
  registerPushTokenUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
  unregisterPushTokenUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
  syncPushTopicsUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
  observePushTokenRefreshUseCase: { execute: jest.fn(() => () => undefined) },
  observeNotificationOpenUseCase: { execute: jest.fn(() => () => undefined) },
  getInitialNotificationUseCase: { execute: jest.fn().mockResolvedValue(null) }
};

jest.mock("../AppProvidersWithDI", () => ({
  DependenciesProvider: ({ children }: any) => <>{children}</>,
  useDependencies: () => mockDeps
}));

jest.mock("../../../hooks/useValidateToken", () => ({
  useValidateToken: jest.fn()
}));

jest.mock("../../../storage/authStorage", () => ({
  getTokens: () => mockGetTokens()
}));

jest.mock("../../../api/client", () => ({
  clearAuthSession: () => mockClearAuthSession(),
  primeApiToken: (token: string) => mockPrimeApiToken(token)
}));

jest.mock("../../navigation/navigationRef", () => ({
  navigationRef: {
    isReady: () => true,
    reset: (...args: any[]) => mockNavigationReset(...args),
    navigate: (...args: any[]) => mockNavigationNavigate(...args)
  }
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => () => undefined)
}));

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn().mockResolvedValue({ authorizationStatus: 1 }),
    createChannel: jest.fn().mockResolvedValue("default"),
    displayNotification: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn())
  },
  AndroidImportance: { HIGH: 4 },
  EventType: { PRESS: 1, ACTION_PRESS: 2 }
}));

jest.mock("@react-native-firebase/messaging", () => ({
  __esModule: true,
  default: () => ({
    onMessage: jest.fn(() => jest.fn()),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    requestPermission: jest.fn().mockResolvedValue(1),
    registerDeviceForRemoteMessages: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue("push-token")
  }),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 }
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" }, nativeAppVersion: "1.0.0" }
}));

describe("AppProviders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, handler) => ({ remove: jest.fn(), handler }));
  });

  it("renders children when no token is stored", async () => {
    (useValidateToken as jest.Mock).mockReturnValue({ status: "idle", refetch: mockRefetch });
    mockGetTokens.mockResolvedValue({ token: null });

    const { getByText } = render(
      <AppProviders>
        <Text>ready</Text>
      </AppProviders>
    );

    await act(async () => {
      await flushPromises();
    });
    await waitFor(() => expect(getByText("ready")).toBeTruthy());
    expect(mockPrimeApiToken).not.toHaveBeenCalled();
  });

  it("boots with token and triggers validation", async () => {
    (useValidateToken as jest.Mock).mockReturnValue({ status: "success", refetch: mockRefetch });
    mockGetTokens.mockResolvedValue({ token: "token-1" });

    render(
      <AppProviders>
        <Text>ready</Text>
      </AppProviders>
    );

    await act(async () => {
      await flushPromises();
    });

    await waitFor(() => expect(mockPrimeApiToken).toHaveBeenCalledWith("token-1"));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("syncs favorites on mount and app state change", async () => {
    (useValidateToken as jest.Mock).mockReturnValue({ status: "idle", refetch: mockRefetch });
    mockGetTokens.mockResolvedValue({ token: null });

    render(
      <AppProviders>
        <Text>ready</Text>
      </AppProviders>
    );

    await act(async () => {
      await flushPromises();
    });

    const initialCalls = mockDeps.favoriteRepository.syncPending.mock.calls.length;
    expect(initialCalls).toBeGreaterThan(0);

    const calls = (AppState.addEventListener as jest.Mock).mock.calls;
    calls.forEach((call) => {
      const handler = call[1];
      if (typeof handler === "function") {
        handler("active");
      }
    });

    expect(mockDeps.favoriteRepository.syncPending).toHaveBeenCalled();
    expect(mockDeps.favoriteRepository.syncPending.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it("clears auth session when validation fails", async () => {
    (useValidateToken as jest.Mock).mockReturnValue({ status: "error", refetch: mockRefetch });
    mockGetTokens.mockResolvedValue({ token: "token-1" });

    render(
      <AppProviders>
        <Text>ready</Text>
      </AppProviders>
    );

    await act(async () => {
      await flushPromises();
    });
    await waitFor(() => expect(mockClearAuthSession).toHaveBeenCalled());
    expect(mockNavigationNavigate).toHaveBeenCalledWith("login");
  });
});
