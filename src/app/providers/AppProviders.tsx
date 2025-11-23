import React, { PropsWithChildren, useEffect, useState } from "react";
import { DependenciesProvider, useDependencies } from "./AppProvidersWithDI";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../hooks/reactQueryClient";
import { getTokens, clearTokens } from "../../storage/authStorage";
import { useValidateToken } from "../../hooks/useValidateToken";
import { navigationRef } from "../navigation/navigationRef";

// Add cross-cutting providers (theme, auth, localization, etc.) here.
export function AppProviders(props: PropsWithChildren) {
  const { children } = props;

  return (
    <DependenciesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>{children}</AuthBootstrap>
      </QueryClientProvider>
    </DependenciesProvider>
  );
}

function FirebaseBootstrap() {
  const { getProfileUseCase } = useDependencies();
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfileUseCase.execute();
        if (profile?.id) setUserId(profile.id);
      } catch {
        // ignore; crashlytics still enabled
      }
    })();
  }, [getProfileUseCase]);

  return null;
}

function AuthBootstrap({ children }: PropsWithChildren) {
  const [booting, setBooting] = useState(true);
  const validateTokenQuery = useValidateToken(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { token } = await getTokens();
      if (!token) {
        setBooting(false);
        return;
      }
      await validateTokenQuery.refetch({ throwOnError: false });
      setBooting(false);
    })();
    return () => {
      active = false;
    };
  }, [validateTokenQuery]);

  useEffect(() => {
    if (validateTokenQuery.isError) {
      clearTokens();
      // fallback navigation to login when navigation is ready
      if (navigationRef.isReady()) {
        navigationRef.navigate("login");
      }
    }
  }, [validateTokenQuery.isError]);

  if (booting) {
    return null; // keep splash
  }

  return children as JSX.Element;
}
