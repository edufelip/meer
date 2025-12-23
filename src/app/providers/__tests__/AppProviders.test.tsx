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
  favoriteRepository: { syncPending: jest.fn() }
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
    const handler = calls[calls.length - 1][1];
    handler("active");

    expect(mockDeps.favoriteRepository.syncPending).toHaveBeenCalledTimes(initialCalls + 1);
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
