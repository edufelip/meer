import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProviders } from "./providers/AppProviders";
import { RootStack } from "./navigation/RootStack";
import { navigationRef } from "./navigation/navigationRef";

export function AppRoot() {
  return (
    <AppProviders>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer ref={navigationRef}>
          <RootStack />
        </NavigationContainer>
      </GestureHandlerRootView>
    </AppProviders>
  );
}
