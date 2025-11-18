import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppProviders } from "./providers/AppProviders";
import { RootTabs } from "./navigation/RootTabs";

export function AppRoot() {
  return (
    <AppProviders>
      <NavigationContainer>
        <RootTabs />
      </NavigationContainer>
    </AppProviders>
  );
}
