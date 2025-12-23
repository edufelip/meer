import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SectionTitle } from "../SectionTitle";
import { CategoryCard, getCategoryDisplayName } from "../CategoryCard";
import { FilterChips } from "../FilterChips";
import { ThriftAvatar } from "../ThriftAvatar";
import { FeaturedThriftCarousel } from "../FeaturedThriftCarousel";
import { NearbyHeroCard } from "../NearbyHeroCard";
import { NearbyMapCard } from "../NearbyMapCard";
import { NearbyThriftListItem } from "../NearbyThriftListItem";
import { FavoriteThriftCard } from "../FavoriteThriftCard";
import { GuideContentCard } from "../GuideContentCard";
import { AppHeader } from "../AppHeader";

type ReactTestInstance = any;

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}));

const makeStore = (overrides: Partial<any> = {}) => ({
  id: "store-1",
  name: "Vintage Vibes",
  tagline: "tag",
  coverImageUrl: "https://example.com/cover.jpg",
  imageUrl: "https://example.com/image.jpg",
  addressLine: "Rua 1",
  openingHours: "Seg",
  categories: ["Vintage"],
  ...overrides
});

const makeCategory = (overrides: Partial<any> = {}) => ({
  id: "cat-1",
  nameStringId: "brecho_de_casa",
  imageResId: "unknown",
  ...overrides
});

const makeContent = (overrides: Partial<any> = {}) => ({
  id: "content-1",
  title: "Dicas",
  description: "Desc",
  categoryLabel: "Guia",
  imageUrl: "https://example.com/image.jpg",
  storeId: "store-1",
  thriftStoreName: "Loja",
  createdAt: "2024-01-02T00:00:00.000Z",
  ...overrides
});

const findPressableParent = (node: ReactTestInstance | null): ReactTestInstance => {
  let current: ReactTestInstance | null = node;
  while (current) {
    if (typeof current.props?.onPress === "function") return current;
    current = current.parent;
  }
  throw new Error("No pressable parent found");
};

describe("presentation components", () => {
  it("renders SectionTitle", () => {
    const { getByText } = render(<SectionTitle title="Favoritos" />);
    expect(getByText("Favoritos")).toBeTruthy();
  });

  it("maps category display names", () => {
    expect(getCategoryDisplayName("brecho_de_casa")).toBe("Brechó de Casa");
    expect(getCategoryDisplayName("nome_personalizado")).toBe("Nome Personalizado");
  });

  it("renders CategoryCard and triggers onPress", () => {
    const onPress = jest.fn();
    const category = makeCategory({ nameStringId: "brecho_de_desapego" });
    const { getByText } = render(<CategoryCard category={category} onPress={onPress} />);

    fireEvent.press(findPressableParent(getByText("Brechó de Desapego")));

    expect(getByText("Brechó de Desapego")).toBeTruthy();
    expect(onPress).toHaveBeenCalledWith(category);
  });

  it("renders AppHeader and handles search press", () => {
    const onPressSearch = jest.fn();
    const { getByRole } = render(<AppHeader title="Buscar" onPressSearch={onPressSearch} />);

    fireEvent.press(getByRole("button"));

    expect(onPressSearch).toHaveBeenCalledTimes(1);
  });

  it("renders FilterChips and changes selection", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <FilterChips options={["All", "Nearby"]} active="All" onChange={onChange} />
    );

    fireEvent.press(getByText("Nearby"));

    expect(onChange).toHaveBeenCalledWith("Nearby");
  });

  it("renders ThriftAvatar and handles press", () => {
    const onPress = jest.fn();
    const store = makeStore({ badgeLabel: "Mais amado" });
    const { getByText } = render(<ThriftAvatar store={store} onPress={onPress} />);

    fireEvent.press(findPressableParent(getByText("Vintage Vibes")));

    expect(onPress).toHaveBeenCalledWith(store);
    expect(getByText("Vintage Vibes")).toBeTruthy();
  });

  it("renders FeaturedThriftCarousel and forwards press", () => {
    const onPressItem = jest.fn();
    const stores = [makeStore({ id: "s1", name: "S1" }), makeStore({ id: "s2", name: "S2" })];
    const { getByText } = render(<FeaturedThriftCarousel stores={stores} onPressItem={onPressItem} />);

    fireEvent.press(findPressableParent(getByText("S1")));

    expect(onPressItem).toHaveBeenCalledWith(stores[0]);
    expect(getByText("S1")).toBeTruthy();
  });

  it("renders NearbyHeroCard and handles list press", () => {
    const onPressList = jest.fn();
    const store = makeStore({ description: "Desc" });
    const { getByText } = render(<NearbyHeroCard store={store} onPressList={onPressList} />);

    fireEvent.press(findPressableParent(getByText("Ver lista")));

    expect(onPressList).toHaveBeenCalledTimes(1);
    expect(getByText("Ver lista")).toBeTruthy();
  });

  it("renders NearbyMapCard and handles locate", () => {
    const onLocate = jest.fn();
    const { getByLabelText } = render(<NearbyMapCard imageUrl="https://example.com/map.jpg" onLocate={onLocate} />);

    fireEvent.press(getByLabelText("Localizar"));

    expect(onLocate).toHaveBeenCalledTimes(1);
  });

  it("renders NearbyThriftListItem with distance and image", () => {
    const store = makeStore({ distanceKm: 1.25, walkTimeMinutes: 5 });
    const { getByText } = render(<NearbyThriftListItem store={store} />);

    expect(getByText("1.3 km · 5 min")).toBeTruthy();
  });

  it("renders NearbyThriftListItem fallback initials", () => {
    const store = makeStore({ coverImageUrl: undefined, imageUrl: undefined, galleryUrls: undefined, name: "My Store" });
    const { getByText } = render(<NearbyThriftListItem store={store} />);

    expect(getByText("MS")).toBeTruthy();
  });

  it("renders FavoriteThriftCard and fallback address", () => {
    const store = makeStore({ coverImageUrl: undefined, imageUrl: undefined, galleryUrls: undefined, addressLine: undefined, neighborhood: undefined });
    const onPress = jest.fn();
    const { getByText } = render(<FavoriteThriftCard store={store} onPress={onPress} />);

    fireEvent.press(findPressableParent(getByText("Vintage Vibes")));

    expect(getByText("Endereço disponível em breve")).toBeTruthy();
    expect(onPress).toHaveBeenCalledWith(store);
  });

  it("renders GuideContentCard with date", () => {
    const content = makeContent();
    const onPress = jest.fn();
    const { getByText } = render(<GuideContentCard content={content} onPress={onPress} />);

    fireEvent.press(findPressableParent(getByText("Dicas")));

    expect(getByText("Loja")).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders GuideContentCard without date", () => {
    const content = makeContent({ createdAt: undefined });
    const { getByText } = render(<GuideContentCard content={content} />);

    expect(getByText("Dicas")).toBeTruthy();
  });
});
