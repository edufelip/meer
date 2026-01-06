import React from "react";
import { render } from "@testing-library/react-native";
import { FavoritesScreen } from "../FavoritesScreen";
import { useFavoritesStore } from "../../../state/favoritesStore";

const mockGetFavorites = jest.fn();
const mockDependencies = {
  getFavoriteThriftStoresUseCase: { execute: (...args: any[]) => mockGetFavorites(...args) }
};
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
const flushAsync = async (times = 3) => {
  for (let i = 0; i < times; i += 1) {
    await flushPromises();
  }
};

jest.mock("@react-navigation/native", () => {
  const React = jest.requireActual("react");
  return {
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: (cb: any) => {
      React.useEffect(() => cb(), [cb]);
    }
  };
});

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => mockDependencies
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined)
}));

describe("FavoritesScreen (integration)", () => {
  let consoleSpy: jest.SpyInstance;
  const originalConsoleError = console.error;

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

  beforeEach(() => {
    useFavoritesStore.getState().reset();
    mockGetFavorites.mockResolvedValue([]);
  });

  it("transitions from loading to empty after fetch", async () => {
    const { getByText, queryByText, rerender } = render(<FavoritesScreen />);

    expect(queryByText("Sua lista está vazia")).toBeNull();
    await flushAsync(5);
    expect(mockGetFavorites).toHaveBeenCalled();
    expect(useFavoritesStore.getState().loading).toBe(false);
    rerender(<FavoritesScreen />);
    expect(getByText("Sua lista está vazia")).toBeTruthy();
  });
});
