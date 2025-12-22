import React from "react";
import { FlatList } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { CategoriesScreen } from "../CategoriesScreen";

const mockNavigate = jest.fn();
const mockGetCachedCategories = jest.fn();
const mockGetCategories = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getCachedCategoriesUseCase: { execute: (...args: any[]) => mockGetCachedCategories(...args) },
    getCategoriesUseCase: { execute: (...args: any[]) => mockGetCategories(...args) }
  })
}));

jest.mock("../../../components/CategoryCard", () => ({
  getCategoryDisplayName: (name: string) => `display-${name}`,
  CategoryCard: ({ category, onPress }: any) => {
    const mockReactNative = jest.requireActual("react-native");
    return (
      <mockReactNative.Pressable testID={`cat-${category.id}`} onPress={onPress}>
        <mockReactNative.Text>{category.nameStringId}</mockReactNative.Text>
      </mockReactNative.Pressable>
    );
  }
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

describe("CategoriesScreen", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGetCachedCategories.mockResolvedValue([{ id: "c1", nameStringId: "shoes" }]);
    mockGetCategories.mockResolvedValue([]);
  });

  it("renders cached categories and navigates on press", async () => {
    const { getByTestId } = render(<CategoriesScreen />);

    const card = await waitFor(() => getByTestId("cat-c1"));
    fireEvent.press(card);

    expect(mockNavigate).toHaveBeenCalledWith("categoryStores", {
      categoryId: "c1",
      title: "display-shoes"
    });
  });

  it("shows empty state when no cache is available", async () => {
    mockGetCachedCategories.mockResolvedValue([]);
    const { getByText } = render(<CategoriesScreen />);

    await waitFor(() =>
      expect(getByText("Nenhuma categoria em cache. Abra a tela inicial com conexão para atualizar.")).toBeTruthy()
    );
  });

  it("refreshes categories from remote", async () => {
    mockGetCachedCategories.mockResolvedValue([]);
    const { UNSAFE_getByType } = render(<CategoriesScreen />);

    const list = await waitFor(() => UNSAFE_getByType(FlatList));
    await act(async () => {
      await list.props.refreshControl.props.onRefresh();
    });

    expect(mockGetCategories).toHaveBeenCalled();
  });
});
