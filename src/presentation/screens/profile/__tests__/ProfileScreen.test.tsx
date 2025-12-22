import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ProfileScreen } from "../ProfileScreen";

const mockNavigate = jest.fn();
const mockGetCachedProfile = jest.fn();
const mockGetProfile = jest.fn();
const mockGetTokens = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: () => {}
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getCachedProfileUseCase: { execute: (...args: any[]) => mockGetCachedProfile(...args) },
    getProfileUseCase: { execute: (...args: any[]) => mockGetProfile(...args) }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

jest.mock("../../../../storage/authStorage", () => ({
  getTokens: () => mockGetTokens()
}));

describe("ProfileScreen", () => {
  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCachedProfile.mockResolvedValue({
      id: "u1",
      name: "Bea",
      email: "bea@test.com",
      avatarUrl: "http://avatar",
      notifyNewStores: false,
      notifyPromos: false,
      ownedThriftStore: { id: "store-1" }
    });
    mockGetProfile.mockResolvedValue(null);
    mockGetTokens.mockResolvedValue({ token: null });
  });

  it("renders cached profile data", async () => {
    const view = render(<ProfileScreen />);
    await act(async () => {
      await flushPromises();
    });
    const { getByText } = view;
    await waitFor(() => expect(getByText("Bea")).toBeTruthy());
    expect(getByText("bea@test.com")).toBeTruthy();
  });

  it("falls back to JWT payload when cache is empty", async () => {
    mockGetCachedProfile.mockResolvedValue(null);
    const payload = {
      sub: "u99",
      name: "Token User",
      email: "token@test.com",
      avatarUrl: "http://avatar",
      ownedThriftStore: null,
      notifyNewStores: true,
      notifyPromos: false
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
    mockGetTokens.mockResolvedValue({ token: `header.${encoded}.sig` });

    const view = render(<ProfileScreen />);
    const { getByText } = view;
    await waitFor(() => expect(getByText("Token User")).toBeTruthy());
    expect(getByText("token@test.com")).toBeTruthy();
  });

  it("navigates to my contents when tapping Criar Conteúdo", async () => {
    const view = render(<ProfileScreen />);
    await act(async () => {
      await flushPromises();
    });

    await waitFor(() => expect(view.getByText("Criar Conteúdo")).toBeTruthy());
    fireEvent.press(view.getByText("Criar Conteúdo"));

    expect(mockNavigate).toHaveBeenCalledWith("myContents", { storeId: "store-1" });
  });
});
