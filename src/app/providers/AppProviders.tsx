import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { DependenciesProvider, useDependencies } from "./AppProvidersWithDI";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../hooks/reactQueryClient";
import { getTokens, clearTokens } from "../../storage/authStorage";
import { useValidateToken } from "../../hooks/useValidateToken";
import { navigationRef } from "../navigation/navigationRef";
import { primeApiToken } from "../../api/client";

// Add cross-cutting providers (theme, auth, localization, etc.) here.
export function AppProviders(props: PropsWithChildren) {
  const { children } = props;

  return (
    <DependenciesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>{children}</AuthBootstrap>
        <FirebaseBootstrap />
        <FavoriteSyncBootstrap />
      </QueryClientProvider>
    </DependenciesProvider>
  );
}

function FirebaseBootstrap() {
  const { getProfileUseCase } = useDependencies();
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const { token } = await getTokens();
      if (!token) return;
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
  const hasBootstrapped = useRef(false);
  const hasRerouted = useRef(false);
  const validateTokenQuery = useValidateToken(false);
  const { refetch } = validateTokenQuery;

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;
    (async () => {
      const { token } = await getTokens();
      if (!token) {
        setBooting(false);
        return;
      }
      primeApiToken(token);
      await refetch({ throwOnError: false });
      setBooting(false);
    })();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (validateTokenQuery.status === "error") {
      clearTokens();
      // fallback navigation to login when navigation is ready
      if (navigationRef.isReady()) {
        navigationRef.navigate("login");
      }
    }
  }, [validateTokenQuery.status]);

  useEffect(() => {
    if (booting) return;
    if (validateTokenQuery.status === "success" && !hasRerouted.current) {
      hasRerouted.current = true;
      const current = navigationRef.getCurrentRoute()?.name;
      if (navigationRef.isReady() && (current === "login" || current === undefined)) {
        navigationRef.navigate("tabs");
      }
    }
  }, [booting, validateTokenQuery.status]);

  if (booting) {
    return null; // keep splash
  }

  return children as JSX.Element;
}

function FavoriteSyncBootstrap() {
  const { favoriteRepository } = useDependencies();

  useEffect(() => {
    favoriteRepository.syncPending();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        favoriteRepository.syncPending();
      }
    });

    return () => {
      sub.remove();
    };
  }, [favoriteRepository]);

  return null;
}
