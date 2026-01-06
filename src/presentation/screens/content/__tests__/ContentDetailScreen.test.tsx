import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ContentDetailScreen } from "../ContentDetailScreen";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

const mockGoBack = jest.fn();
const mockUseRoute = jest.fn();
const mockGetGuideContentById = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => mockUseRoute()
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getGuideContentByIdUseCase: { execute: (...args: any[]) => mockGetGuideContentById(...args) }
  })
}));

describe("ContentDetailScreen", () => {
  let consoleSpy: jest.SpyInstance;
  const originalConsoleError = console.error;

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      const shouldIgnore = args.some(
        (arg) => typeof arg === "string" && arg.includes("not wrapped in act")
      );
      if (shouldIgnore) return;
      originalConsoleError(...(args as [unknown, ...unknown[]]));
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  beforeEach(() => {
    mockGoBack.mockClear();
    mockGetGuideContentById.mockReset();
    mockUseRoute.mockReturnValue({
      params: {
        content: {
          id: "content-1",
          title: "Guia",
          description: "Texto",
          imageUrl: "https://example.com/img.jpg",
          thriftStoreName: "Loja",
          createdAt: "2024-01-02T00:00:00.000Z"
        }
      }
    });
  });

  it("renders content and handles back", () => {
    const { getByText, getByLabelText } = render(<ContentDetailScreen />);

    expect(getByText("Guia")).toBeTruthy();
    expect(getByText("Texto")).toBeTruthy();
    expect(getByText("Loja")).toBeTruthy();

    fireEvent.press(getByLabelText("Voltar"));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it("loads content by id when routed with a contentId", async () => {
    mockUseRoute.mockReturnValue({ params: { contentId: "content-2" } });
    mockGetGuideContentById.mockResolvedValue({
      id: "content-2",
      title: "Conteúdo 2",
      description: "Descrição 2",
      imageUrl: "https://example.com/img-2.jpg",
      thriftStoreName: "Loja 2",
      createdAt: "2024-01-03T00:00:00.000Z"
    });

    const view = render(<ContentDetailScreen />);

    await waitFor(() => expect(view.getByText("Conteúdo 2")).toBeTruthy());
    expect(mockGetGuideContentById).toHaveBeenCalledWith("content-2");
  });
});
