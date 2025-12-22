import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { SearchScreen } from "../SearchScreen";

const mockGoBack = jest.fn();
const mockSearch = jest.fn();
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    searchThriftStoresUseCase: { execute: (...args: any[]) => mockSearch(...args) }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../components/NearbyThriftListItem", () => ({
  NearbyThriftListItem: () => null
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: () => mockGetItem(),
  setItem: (...args: any[]) => mockSetItem(...args),
  removeItem: (...args: any[]) => mockRemoveItem(...args)
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: () => () => undefined
}));

describe("SearchScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearch.mockResolvedValue([]);
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
  });

  it("renders search suggestions", () => {
    const { getByText } = render(<SearchScreen />);
    expect(getByText("Sugestões de busca")).toBeTruthy();
  });

  it("persists search history on submit", async () => {
    mockSearch.mockResolvedValue([{ id: "s1", name: "Store" }]);

    const { getByPlaceholderText } = render(<SearchScreen />);
    fireEvent.changeText(getByPlaceholderText("Buscar por brechó, item..."), "Vestidos");
    await act(async () => {
      fireEvent(getByPlaceholderText("Buscar por brechó, item..."), "submitEditing");
    });

    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith("Vestidos"));
    expect(mockSetItem).toHaveBeenCalledWith("search.history", JSON.stringify(["Vestidos"]));
  });

  it("clears history when tapping Limpar", async () => {
    jest.useFakeTimers();
    mockGetItem.mockResolvedValue(JSON.stringify(["Foo"]));
    const { getByText } = render(<SearchScreen />);

    await waitFor(() => expect(getByText("Pesquisas Recentes")).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText("Limpar"));
      jest.runOnlyPendingTimers();
    });

    expect(mockRemoveItem).toHaveBeenCalledWith("search.history");
    jest.useRealTimers();
  });
});
