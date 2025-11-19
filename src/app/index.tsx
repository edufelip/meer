import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppProviders } from "./providers/AppProviders";
import { RootStack } from "./navigation/RootStack";

export function AppRoot() {
  return (
    <AppProviders>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </AppProviders>
  );
}
