import React, { PropsWithChildren, useEffect, useState } from "react";
import { DependenciesProvider, useDependencies } from "./AppProvidersWithDI";
import { useCrashlytics } from "../../services/firebase/crashlyticsSetup";
import { useFirebaseMessaging } from "../../services/firebase/messagingSetup";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../hooks/reactQueryClient";
import { getTokens, clearTokens } from "../../storage/authStorage";
import { useValidateToken } from "../../hooks/useValidateToken";
import { NavigationContainer } from "@react-navigation/native";
import { RootStack } from "../navigation/RootStack";

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

  useCrashlytics(userId); // enable by default and attach user if available

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

  useFirebaseMessaging(() => {
    // placeholder handler; hook initialized for permissions/token
  });

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
      validateTokenQuery.refetch({ throwOnError: false });
      setBooting(false);
    })();
    return () => {
      active = false;
    };
  }, [validateTokenQuery]);

  useEffect(() => {
    if (validateTokenQuery.isError) {
      clearTokens();
    }
  }, [validateTokenQuery.isError]);

  if (booting) {
    return null; // keep splash
  }

  return children as JSX.Element;
}
