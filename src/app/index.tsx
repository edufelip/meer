import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProviders } from "./providers/AppProviders";
import { RootStack } from "./navigation/RootStack";
import { navigationRef } from "./navigation/navigationRef";
import { linking } from "./navigation/linking";

export function AppRoot() {
  return (
    <AppProviders>
      <GestureHandlerRootView style={{ flex: 1 }} testID="app-root">
        <NavigationContainer ref={navigationRef} linking={linking}>
          <RootStack />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AppProviders>
  );
}
