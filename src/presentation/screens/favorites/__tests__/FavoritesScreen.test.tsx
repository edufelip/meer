import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { FavoritesScreen } from "../FavoritesScreen";

const mockFavoritesState = {
  items: [],
  loading: false,
  refreshing: false,
  setFavorites: jest.fn(),
  setLoading: jest.fn(),
  setRefreshing: jest.fn()
};

const mockGetFavorites = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: (cb: any) => cb()
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getFavoriteThriftStoresUseCase: { execute: (...args: any[]) => mockGetFavorites(...args) }
  })
}));

jest.mock("../../../state/favoritesStore", () => ({
  useFavoritesStore: (selector: any) => (selector ? selector(mockFavoritesState) : mockFavoritesState)
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined)
}));

describe("FavoritesScreen", () => {
  let consoleSpy: jest.SpyInstance;
  const originalConsoleError = console.error;

  beforeEach(() => {
    mockFavoritesState.items = [];
    mockFavoritesState.loading = false;
    mockFavoritesState.refreshing = false;
    mockGetFavorites.mockResolvedValue([]);
  });

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      const shouldIgnore = args.some(
        (arg) => typeof arg === "string" && arg.includes("not wrapped in act")
      );
      if (shouldIgnore) {
        return;
      }
      originalConsoleError(...(args as [unknown, ...unknown[]]));
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it("shows empty state when no favorites", async () => {
    const { getByText } = render(<FavoritesScreen />);
    await waitFor(() => expect(mockGetFavorites).toHaveBeenCalled());
    await waitFor(() => expect(getByText("Sua lista está vazia")).toBeTruthy(), { timeout: 3000 });
  });
});
