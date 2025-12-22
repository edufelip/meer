import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ContentDetailScreen } from "../ContentDetailScreen";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      content: {
        title: "Guia",
        description: "Texto",
        imageUrl: "https://example.com/img.jpg",
        thriftStoreName: "Loja",
        createdAt: "2024-01-02T00:00:00.000Z"
      }
    }
  })
}));

describe("ContentDetailScreen", () => {
  beforeEach(() => {
    mockGoBack.mockClear();
  });

  it("renders content and handles back", () => {
    const { getByText, getByLabelText } = render(<ContentDetailScreen />);

    expect(getByText("Guia")).toBeTruthy();
    expect(getByText("Texto")).toBeTruthy();
    expect(getByText("Loja")).toBeTruthy();

    fireEvent.press(getByLabelText("Voltar"));
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
