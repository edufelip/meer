import React from "react";
import { act, render, waitFor, fireEvent } from "@testing-library/react-native";
import { HomeScreen } from "../HomeScreen";
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";

const mockNavigate = jest.fn();
const mockGetFeatured = jest.fn();
const mockGetNearby = jest.fn();
const mockGetGuides = jest.fn();
const mockGetCategories = jest.fn();
const mockGetTokens = jest.fn();
const mockLoadHomeCache = jest.fn();
const mockSaveHomeCache = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate })
}));

jest.mock("../../../../app/providers/AppProvidersWithDI", () => ({
  useDependencies: () => ({
    getFeaturedThriftStoresUseCase: { execute: (...args: any[]) => mockGetFeatured(...args) },
    getNearbyPaginatedUseCase: { execute: (...args: any[]) => mockGetNearby(...args) },
    getGuideContentUseCase: { execute: (...args: any[]) => mockGetGuides(...args) },
    getCategoriesUseCase: { execute: (...args: any[]) => mockGetCategories(...args) }
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("react-native-reanimated", () => {
  const Reanimated = jest.requireActual("react-native-reanimated/mock");
  return {
    ...Reanimated,
    createAnimatedComponent: (component: any) => component,
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (value: any) => value,
    interpolateColor: () => "#000"
  };
});

jest.mock("expo-location", () => ({
  Accuracy: { Balanced: "balanced" },
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted", canAskAgain: true }),
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 1, longitude: 2 } }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: "Sao Paulo", isoCountryCode: "BR" }])
}));

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn()
}));

jest.mock("../../../../storage/authStorage", () => ({
  getTokens: () => mockGetTokens()
}));

jest.mock("../../../../data/datasources/impl/AsyncStorageHomeCache", () => ({
  loadHomeCache: () => mockLoadHomeCache(),
  saveHomeCache: (...args: any[]) => mockSaveHomeCache(...args)
}));

jest.mock("../../../../shared/theme", () => ({
  theme: { colors: { highlight: "#000", textSubtle: "#111", complementary: "#222" } }
}));

jest.mock("../../../components/SectionTitle", () => ({
  SectionTitle: () => null
}));

jest.mock("../../../components/FeaturedThriftCarousel", () => ({
  FeaturedThriftCarousel: ({ stores, onPressItem }: any) => {
    const mockReactNative = jest.requireActual("react-native");
    return (
      <mockReactNative.Pressable onPress={() => onPressItem(stores[0])}>
        <mockReactNative.Text>Featured CTA</mockReactNative.Text>
      </mockReactNative.Pressable>
    );
  }
}));

jest.mock("../../../components/NearbyMapCard", () => ({
  NearbyMapCard: () => null
}));

jest.mock("../../../components/NearbyThriftListItem", () => ({
  NearbyThriftListItem: ({ store, onPress }: any) => {
    const mockReactNative = jest.requireActual("react-native");
    return (
      <mockReactNative.Pressable onPress={onPress}>
        <mockReactNative.Text>{store.name}</mockReactNative.Text>
      </mockReactNative.Pressable>
    );
  }
}));

jest.mock("../../../components/GuideContentCard", () => ({
  GuideContentCard: ({ content }: any) => {
    const mockReactNative = jest.requireActual("react-native");
    return <mockReactNative.Text>{content.title}</mockReactNative.Text>;
  }
}));

describe("HomeScreen", () => {
  const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    jest.clearAllMocks();
    (NetInfo.addEventListener as jest.Mock).mockImplementation(() => () => undefined);
    mockGetFeatured.mockResolvedValue([]);
    mockGetNearby.mockResolvedValue({ items: [], page: 1, hasNext: false });
    mockGetGuides.mockResolvedValue({ items: [], hasNext: false });
    mockGetCategories.mockResolvedValue([]);
    mockGetTokens.mockResolvedValue({ token: null });
    mockLoadHomeCache.mockResolvedValue(null);
    mockSaveHomeCache.mockResolvedValue(undefined);
  });

  it("renders the home header", async () => {
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });
    const { getByText } = view;
    await waitFor(() => expect(getByText("Guia Brechó")).toBeTruthy());
  });

  it("shows offline banner when netinfo reports disconnected", async () => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((handler: any) => {
      handler({ isConnected: false });
      return () => undefined;
    });

    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    expect(view.getByText("Sem conexão. Mostrando dados locais. Tentando reconectar...")).toBeTruthy();
  });

  it("fetches data after location resolves and stores cache", async () => {
    mockGetFeatured.mockResolvedValue([{ id: "s1", name: "Store 1" }]);
    mockGetNearby.mockResolvedValue({ items: [{ id: "s2", name: "Store 2" }], page: 1, hasNext: false });
    mockGetGuides.mockResolvedValue({ items: [{ id: "g1", title: "Guide", imageUrl: "img" }], hasNext: true });
    mockGetCategories.mockResolvedValue([{ id: "c1", nameStringId: "cat" }]);

    render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    await waitFor(() => expect(mockGetFeatured).toHaveBeenCalled());
    expect(mockGetNearby).toHaveBeenCalled();
    expect(mockGetGuides).toHaveBeenCalled();
    expect(mockGetCategories).toHaveBeenCalled();
    expect(mockSaveHomeCache).toHaveBeenCalled();
  });

  it("navigates to contents list from header action", async () => {
    const guides = [
      {
        id: "g1",
        title: "Guide",
        imageUrl: "img",
        description: "Desc",
        thriftStoreName: "Store A",
        thriftStoreCoverImageUrl: "cover",
        createdAt: "2024-01-01T00:00:00Z"
      }
    ];
    mockGetGuides.mockResolvedValue({ items: guides, hasNext: false });

    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    const { getByLabelText } = view;
    fireEvent.press(getByLabelText("Ver todos os conteúdos"));

    expect(mockNavigate).toHaveBeenCalledWith("contents", {
      initialItems: guides,
      initialPage: 0,
      initialHasNext: false,
      initialPageSize: guides.length
    });
  });

  it("passes through guides pagination when navigating to contents list", async () => {
    const guides = [
      {
        id: "g1",
        title: "Guide",
        imageUrl: "img",
        description: "Desc",
        thriftStoreName: "Store A",
        thriftStoreCoverImageUrl: "cover",
        createdAt: "2024-01-01T00:00:00Z"
      }
    ];
    mockGetGuides.mockResolvedValue({ items: guides, hasNext: true });

    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByLabelText("Ver todos os conteúdos"));

    expect(mockNavigate).toHaveBeenCalledWith("contents", {
      initialItems: guides,
      initialPage: 0,
      initialHasNext: true,
      initialPageSize: guides.length
    });
  });

  it("filters nearby list by neighborhood chip", async () => {
    mockGetNearby.mockResolvedValue({
      items: [
        { id: "s1", name: "Centro Store", neighborhood: "Centro" },
        { id: "s2", name: "Pinheiros Store", neighborhood: "Pinheiros" }
      ],
      page: 1,
      hasNext: false
    });

    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    const { getByText, queryByText } = view;
    await waitFor(() => expect(getByText("Centro Store")).toBeTruthy());

    fireEvent.press(getByText("Pinheiros"));
    await waitFor(() => expect(getByText("Pinheiros Store")).toBeTruthy());
    expect(queryByText("Centro Store")).toBeNull();
  });

  it("navigates to thrift detail when tapping nearby list item", async () => {
    mockGetNearby.mockResolvedValue({
      items: [{ id: "s3", name: "Nearby Store", neighborhood: "Centro" }],
      page: 1,
      hasNext: false
    });

    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByText("Nearby Store"));
    expect(mockNavigate).toHaveBeenCalledWith("thriftDetail", { id: "s3" });
  });

  it("navigates to search when tapping search icon", async () => {
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    const { getByTestId } = view;
    fireEvent.press(getByTestId("home-search-button"));

    expect(mockNavigate).toHaveBeenCalledWith("search");
  });

  it("navigates to nearby category list from map CTA", async () => {
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByText("Ver lista"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "categoryStores",
      expect.objectContaining({
        type: "nearby",
        title: "Brechós próximos",
        lat: 1,
        lng: 2
      })
    );
  });

  it("navigates to thrift detail from featured carousel", async () => {
    mockGetFeatured.mockResolvedValue([{ id: "s9", name: "Store 9" }]);
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByText("Featured CTA"));
    expect(mockNavigate).toHaveBeenCalledWith("thriftDetail", { id: "s9" });
  });

  it("exposes the view-all-stores button", async () => {
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    expect(view.getByTestId("home-view-all-stores")).toBeTruthy();
  });

  it("navigates to nearby list when tapping view-all-stores CTA", async () => {
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByTestId("home-view-all-stores"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "categoryStores",
      expect.objectContaining({
        type: "nearby",
        title: "Brechós próximos",
        lat: 1,
        lng: 2
      })
    );
  });

  it("uses default coords when location is unavailable", async () => {
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: "denied", canAskAgain: false });

    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByTestId("home-view-all-stores"));
    expect(mockNavigate).toHaveBeenCalledWith(
      "categoryStores",
      expect.objectContaining({
        lat: -23.5561782,
        lng: -46.6375468
      })
    );
  });

  it("navigates to content detail from guide card", async () => {
    const guide = {
      id: "g2",
      title: "Guide 2",
      imageUrl: "img",
      description: "Desc",
      thriftStoreName: "Store A",
      thriftStoreCoverImageUrl: "cover",
      createdAt: "2024-01-01T00:00:00Z"
    };
    mockGetGuides.mockResolvedValue({ items: [guide], hasNext: false });
    const view = render(<HomeScreen />);
    await act(async () => {
      await flushPromises();
    });

    fireEvent.press(view.getByText("Guide 2"));
    expect(mockNavigate).toHaveBeenCalledWith("contentDetail", { content: guide });
  });
});
