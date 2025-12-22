import React from "react";
import { render } from "@testing-library/react-native";
import { ContentsScreen } from "../ContentsScreen";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
  useRoute: () => ({
    params: {
      initialItems: [
        {
          id: "c1",
          title: "Dica",
          imageUrl: "img",
          thriftStoreName: "Store"
        }
      ],
      initialPage: 0,
      initialHasNext: false,
      initialPageSize: 20
    }
  })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getGuideContentUseCase: { execute: jest.fn().mockResolvedValue({ items: [], page: 0, hasNext: false }) }
  })
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

describe("ContentsScreen", () => {
  it("renders contents header", () => {
    const { getByText } = render(<ContentsScreen />);
    expect(getByText("Conteúdo e Dicas")).toBeTruthy();
  });
});
