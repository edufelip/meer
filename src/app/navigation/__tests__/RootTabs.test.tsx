import React from "react";
import { render } from "@testing-library/react-native";
import { RootTabs } from "../RootTabs";

const mockScreenOptionsCalls: any[] = [];

jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ screenOptions, children }: any) => {
      const routes = ["home", "favorites", "categories", "profile"].map((name) => ({ name }));
      routes.forEach((route) => {
        if (typeof screenOptions === "function") {
          mockScreenOptionsCalls.push(screenOptions({ route }));
        }
      });
      return <>{children}</>;
    },
    Screen: ({ component: Component }: any) => <Component />
  })
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, color, size }: any) => (
    <>
      {String(name)}-{String(color)}-{String(size)}
    </>
  )
}));

jest.mock("../../../presentation/screens/home/HomeScreen", () => ({ HomeScreen: () => null }));
jest.mock("../../../presentation/screens/favorites/FavoritesScreen", () => ({ FavoritesScreen: () => null }));
jest.mock("../../../presentation/screens/categories/CategoriesScreen", () => ({ CategoriesScreen: () => null }));
jest.mock("../../../presentation/screens/profile/ProfileScreen", () => ({ ProfileScreen: () => null }));

jest.mock("../../../shared/theme", () => ({
  theme: { colors: { highlight: "#111111", textSubtle: "#777777" } }
}));

describe("RootTabs", () => {
  beforeEach(() => {
    mockScreenOptionsCalls.length = 0;
  });

  it("defines screen options per route", () => {
    render(<RootTabs />);

    const labels = mockScreenOptionsCalls.map((opt) => opt.tabBarLabel);
    expect(labels).toEqual(["Home", "Favoritos", "Categorias", "Perfil"]);

    const icon = mockScreenOptionsCalls[0].tabBarIcon({ color: "#000", size: 20 });
    expect(icon.props.name).toBe("home");
  });
});
