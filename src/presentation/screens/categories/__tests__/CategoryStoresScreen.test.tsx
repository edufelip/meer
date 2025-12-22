import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { CategoryStoresScreen } from "../CategoryStoresScreen";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: { categoryId: "cat-1", title: "Categorias", type: "category" } })
}));

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: () => ({
    data: undefined,
    isLoading: true,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    isRefetching: false,
    refetch: jest.fn()
  }),
  useQueryClient: () => ({
    removeQueries: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn()
  })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getStoresByCategoryUseCase: { execute: jest.fn() },
    getNearbyPaginatedUseCase: { execute: jest.fn() },
    toggleFavoriteThriftStoreUseCase: { execute: jest.fn() }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: () => null
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000", complementary: "#111" } }
}));

describe("CategoryStoresScreen", () => {
  it("renders loading state and navigates back", () => {
    const { getByTestId } = render(<CategoryStoresScreen />);
    fireEvent.press(getByTestId("category-stores-back"));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
