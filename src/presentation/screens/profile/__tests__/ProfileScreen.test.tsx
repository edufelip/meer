import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ProfileScreen } from "../ProfileScreen";
import { useProfileSummaryStore } from "../../../state/profileSummaryStore";

const mockNavigate = jest.fn();
const mockGetCachedProfile = jest.fn();
const mockGetProfile = jest.fn();
const mockGetTokens = jest.fn();
const mockUseRoute = jest.fn();
const mockDependencies = {
  getCachedProfileUseCase: { execute: (...args: any[]) => mockGetCachedProfile(...args) },
  getProfileUseCase: { execute: (...args: any[]) => mockGetProfile(...args) }
};

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, setParams: jest.fn() }),
  useFocusEffect: () => {},
  useRoute: () => mockUseRoute()
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => <>{children}</>,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => mockDependencies
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000" } }
}));

jest.mock("../../../../storage/authStorage", () => ({
  getTokens: () => mockGetTokens()
}));

describe("ProfileScreen", () => {
  const renderProfile = () => render(<ProfileScreen />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRoute.mockReturnValue({ params: undefined });
    mockGetCachedProfile.mockResolvedValue({
      id: "u1",
      name: "Bea",
      email: "bea@test.com",
      bio: "Bio da Bea",
      avatarUrl: "http://avatar",
      notifyNewStores: false,
      notifyPromos: false,
      ownedThriftStore: { id: "store-1" }
    });
    mockGetProfile.mockResolvedValue(null);
    mockGetTokens.mockResolvedValue({ token: null });
  });

  it("renders cached profile data", async () => {
    const view = renderProfile();
    const { getByText } = view;
    await waitFor(() => expect(getByText("Bea")).toBeTruthy());
    expect(getByText("bea@test.com")).toBeTruthy();
    expect(getByText("Bio da Bea")).toBeTruthy();
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

    const view = renderProfile();
    await act(async () => {});
    await waitFor(() => expect(mockGetCachedProfile).toHaveBeenCalled());
    await waitFor(() => expect(mockGetTokens).toHaveBeenCalled());
    await waitFor(() => expect(useProfileSummaryStore.getState().profile?.name).toBe("Token User"));
    const { getByText } = view;
    expect(getByText("Token User")).toBeTruthy();
    expect(getByText("token@test.com")).toBeTruthy();
  });

  it("navigates to my contents when tapping Criar Conteúdo", async () => {
    const view = renderProfile();

    await waitFor(() => expect(view.getByText("Criar Conteúdo")).toBeTruthy());
    fireEvent.press(view.getByText("Criar Conteúdo"));

    expect(mockNavigate).toHaveBeenCalledWith("myContents", { storeId: "store-1" });
  });

  it("shows toast message when provided via route params", async () => {
    mockUseRoute.mockReturnValue({ params: { toast: { message: "Brechó criado com sucesso." } } });
    const view = renderProfile();
    await waitFor(() => expect(view.getByText("Brechó criado com sucesso.")).toBeTruthy());
  });
});
