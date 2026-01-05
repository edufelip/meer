import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { ThriftDetailScreen } from "../ThriftDetailScreen";
import { useFavoritesStore } from "../../../state/favoritesStore";
import { useStoreSummaryStore } from "../../../state/storeSummaryStore";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getThriftStoreByIdUseCase: {
      execute: jest.fn().mockResolvedValue({
        id: "s1",
        name: "Brecho Central",
        addressLine: "Rua A",
        images: [],
        categories: [],
        rating: 4.5
      })
    },
    getFeaturedThriftStoresUseCase: { execute: jest.fn().mockResolvedValue([]) },
    toggleFavoriteThriftStoreUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    isFavoriteThriftStoreUseCase: { execute: jest.fn().mockResolvedValue(false) },
    getMyFeedbackUseCase: { execute: jest.fn().mockResolvedValue(null) },
    upsertFeedbackUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    deleteMyFeedbackUseCase: { execute: jest.fn().mockResolvedValue(undefined) }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock("react-native-image-viewing", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000", complementary: "#111" } }
}));

jest.mock("../../../../shared/deepLinks", () => ({
  buildThriftStoreShareUrl: jest.fn().mockReturnValue("app://store")
}));

describe("ThriftDetailScreen", () => {
  beforeEach(() => {
    useFavoritesStore.getState().reset();
    useStoreSummaryStore.getState().reset();
  });

  it("renders thrift store details", async () => {
    const { getByText } = render(<ThriftDetailScreen route={{ params: { id: "s1" } }} />);
    await waitFor(() => expect(getByText("Brecho Central")).toBeTruthy());
  });
});
