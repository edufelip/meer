import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { HomeScreen } from "../../presentation/screens/home/HomeScreen";
import { FavoritesScreen } from "../../presentation/screens/favorites/FavoritesScreen";
import { CategoriesScreen } from "../../presentation/screens/categories/CategoriesScreen";
import { ProfileScreen } from "../../presentation/screens/profile/ProfileScreen";

export type RootTabParamList = {
  home: undefined;
  favorites: undefined;
  categories: undefined;
  profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: route.name.charAt(0).toUpperCase() + route.name.slice(1),
        tabBarIcon: () => <Text>•</Text>
      })}
    >
      <Tab.Screen name="home" component={HomeScreen} />
      <Tab.Screen name="favorites" component={FavoritesScreen} />
      <Tab.Screen name="categories" component={CategoriesScreen} />
      <Tab.Screen name="profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
