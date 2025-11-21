import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeScreen } from "../../presentation/screens/home/HomeScreen";
import { FavoritesScreen } from "../../presentation/screens/favorites/FavoritesScreen";
import { CategoriesScreen } from "../../presentation/screens/categories/CategoriesScreen";
import { ProfileScreen } from "../../presentation/screens/profile/ProfileScreen";
import { theme } from "../../shared/theme";

export type RootTabParamList = {
  home: undefined;
  favorites: undefined;
  categories: undefined;
  profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel:
          route.name === "home"
            ? "Home"
            : route.name === "favorites"
            ? "Favoritos"
            : route.name === "categories"
            ? "Categorias"
            : "Perfil",
        tabBarIcon: ({ color, size = 22 }) => {
          const iconName =
            route.name === "home"
              ? "home"
              : route.name === "favorites"
              ? "heart"
              : route.name === "categories"
              ? "grid"
              : "person";
          return <Ionicons name={iconName as never} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.highlight,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 6
        }
      })}
    >
      <Tab.Screen name="home" component={HomeScreen} />
      <Tab.Screen name="favorites" component={FavoritesScreen} />
      <Tab.Screen name="categories" component={CategoriesScreen} />
      <Tab.Screen name="profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
