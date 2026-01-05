import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { DependenciesProvider, useDependencies } from "./AppProvidersWithDI";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../hooks/reactQueryClient";
import { getTokens } from "../../storage/authStorage";
import { clearAuthSession, primeApiToken } from "../../api/client";
import { useValidateToken } from "../../hooks/useValidateToken";
import { navigationRef } from "../navigation/navigationRef";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStatusStore } from "../../presentation/state/networkStatusStore";

// Add cross-cutting providers (theme, auth, localization, etc.) here.
export function AppProviders(props: PropsWithChildren) {
  const { children } = props;

  return (
    <DependenciesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>{children}</AuthBootstrap>
        <FirebaseBootstrap />
        <NetworkStatusBootstrap />
        <FavoriteSyncBootstrap />
      </QueryClientProvider>
    </DependenciesProvider>
  );
}

function FirebaseBootstrap() {
  const { getCachedProfileUseCase } = useDependencies();
  const [, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const { token } = await getTokens();
      if (!token) return;
      try {
        // avoid triggering another /auth/me call; rely on cached profile saved during auth/bootstrap
        const profile = await getCachedProfileUseCase.execute();
        if (profile?.id) setUserId(profile.id);
      } catch {
        // ignore; crashlytics still enabled
      }
    })();
  }, [getCachedProfileUseCase]);

  return null;
}

function NetworkStatusBootstrap() {
  const setIsOnline = useNetworkStatusStore((state) => state.setIsOnline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, [setIsOnline]);

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
      clearAuthSession();
      // fallback navigation to login when navigation is ready
      if (navigationRef.isReady()) {
        navigationRef.navigate("login");
      }
    }
  }, [validateTokenQuery.status]);

  useEffect(() => {
    if (booting) return;
    if (validateTokenQuery.status === "success" && !hasRerouted.current) {
      let cancelled = false;
      const tryReset = () => {
        if (cancelled || hasRerouted.current) return;
        if (navigationRef.isReady()) {
          hasRerouted.current = true;
          navigationRef.reset({ index: 0, routes: [{ name: "tabs" }] });
          return;
        }
        setTimeout(tryReset, 50);
      };
      tryReset();
      return () => {
        cancelled = true;
      };
    }
  }, [booting, validateTokenQuery.status]);

  if (booting) {
    return null; // keep splash
  }

  return children as React.ReactElement;
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
