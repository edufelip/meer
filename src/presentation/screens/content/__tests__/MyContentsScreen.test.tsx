import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { MyContentsScreen } from "../MyContentsScreen";

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useRoute: () => ({ params: { storeId: "s1" } }),
  useFocusEffect: (cb: any) => cb()
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getGuideContentUseCase: { execute: jest.fn().mockResolvedValue({ items: [] }) }
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

describe("MyContentsScreen", () => {
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

  it("renders my contents header", async () => {
    const { getByText } = render(<MyContentsScreen />);
    await waitFor(() => expect(getByText("Meus Conteúdos")).toBeTruthy());
  });
});
