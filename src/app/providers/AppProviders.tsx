import React, { PropsWithChildren } from "react";
import { DependenciesProvider } from "./AppProvidersWithDI";

// Add cross-cutting providers (theme, auth, localization, etc.) here.
export function AppProviders(props: PropsWithChildren) {
  const { children } = props;

  return <DependenciesProvider>{children}</DependenciesProvider>;
}
