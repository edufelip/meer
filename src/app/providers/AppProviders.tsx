import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { DependenciesProvider, useDependencies } from "./AppProvidersWithDI";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../hooks/reactQueryClient";
import { getTokens } from "../../storage/authStorage";
import { clearAuthSession, primeApiToken } from "../../api/client";
import { useValidateToken } from "../../hooks/useValidateToken";
import { navigationRef } from "../navigation/navigationRef";
import NetInfo from "@react-native-community/netinfo";
import { useNetworkStatusStore } from "../../presentation/state/networkStatusStore";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import Constants from "expo-constants";
import { parsePushNotificationData } from "../../shared/pushNotifications";
import type { PushNotificationData } from "../../domain/entities/PushNotification";
import { IS_DEBUG_API_BASE_URL } from "../../network/config";
import { setPushRegistrationHandler } from "../../services/pushRegistration";

const PUSH_CHANNEL_ID = "default";

const getPushEnvironment = (): "dev" | "staging" | "prod" => {
  const override = process.env.EXPO_PUBLIC_ENV;
  if (override === "dev" || override === "staging" || override === "prod") {
    return override;
  }
  return IS_DEBUG_API_BASE_URL ? "dev" : "prod";
};

const getAppVersion = (): string => {
  return (
    Constants.expoConfig?.version ??
    (Constants.manifest as { version?: string } | null | undefined)?.version ??
    Constants.nativeAppVersion ??
    "0.0.0"
  );
};

// Add cross-cutting providers (theme, auth, localization, etc.) here.
export function AppProviders(props: PropsWithChildren) {
  const { children } = props;

  return (
    <DependenciesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>{children}</AuthBootstrap>
        <FirebaseBootstrap />
        <PushNotificationsBootstrap />
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

function PushNotificationsBootstrap() {
  const {
    requestPushPermissionUseCase,
    getPushTokenUseCase,
    registerPushTokenUseCase,
    unregisterPushTokenUseCase,
    observePushTokenRefreshUseCase,
    observeNotificationOpenUseCase,
    getInitialNotificationUseCase
  } = useDependencies();
  const listenersRef = useRef<{
    token?: () => void;
    open?: () => void;
    message?: () => void;
    notifee?: () => void;
  }>({});
  const lastTokenRef = useRef<string | null>(null);
  const pendingOpenRef = useRef<PushNotificationData | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const syncingRef = useRef(false);
  const channelReadyRef = useRef(false);

  const cleanupListeners = useCallback(() => {
    listenersRef.current.token?.();
    listenersRef.current.open?.();
    listenersRef.current.message?.();
    listenersRef.current.notifee?.();
    listenersRef.current = {};
  }, []);

  const ensureChannel = useCallback(async () => {
    if (Platform.OS !== "android" || channelReadyRef.current) return;
    await notifee.createChannel({
      id: PUSH_CHANNEL_ID,
      name: "Geral",
      importance: AndroidImportance.HIGH
    });
    channelReadyRef.current = true;
  }, []);

  const navigateToNotification = useCallback((data: PushNotificationData) => {
    const perform = () => {
      if (data.type === "guide_content") {
        navigationRef.navigate("contentDetail", { contentId: data.id });
        return;
      }
      if (data.type === "store") {
        navigationRef.navigate("thriftDetail", { id: data.id });
      }
    };

    let attempts = 0;
    const tryNavigate = () => {
      if (navigationRef.isReady()) {
        perform();
        return;
      }
      attempts += 1;
      if (attempts < 40) {
        setTimeout(tryNavigate, 100);
      }
    };
    tryNavigate();
  }, []);

  const handleOpen = useCallback(
    (data: PushNotificationData) => {
      if (!authTokenRef.current) {
        pendingOpenRef.current = data;
        return;
      }
      navigateToNotification(data);
    },
    [navigateToNotification]
  );

  const displayForegroundNotification = useCallback(
    async (message: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => {
      const title = message.notification?.title ?? message.data?.title;
      const body = message.notification?.body ?? message.data?.body;
      if (!title && !body) return;

      await ensureChannel();
      await notifee.displayNotification({
        title: title ?? "",
        body: body ?? "",
        data: message.data,
        android: {
          channelId: PUSH_CHANNEL_ID,
          pressAction: { id: "default" }
        },
        ios: {
          foregroundPresentationOptions: {
            badge: true,
            sound: true,
            banner: true,
            list: true
          }
        }
      });
    },
    [ensureChannel]
  );

  const syncPush = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const { token } = await getTokens();
      authTokenRef.current = token ?? null;

      if (!token) {
        if (lastTokenRef.current) {
          try {
            await unregisterPushTokenUseCase.execute();
          } catch {
            // ignore unregister failures on logout
          }
        }
        lastTokenRef.current = null;
        cleanupListeners();
        return;
      }

      const permissionGranted = await requestPushPermissionUseCase.execute();
      if (!permissionGranted) return;

      const fcmToken = await getPushTokenUseCase.execute();
      const environment = getPushEnvironment();
      const appVersion = getAppVersion();
      const platform = Platform.OS === "ios" ? "ios" : "android";

      if (lastTokenRef.current !== fcmToken) {
        await registerPushTokenUseCase.execute({
          token: fcmToken,
          platform,
          environment,
          appVersion
        });
        lastTokenRef.current = fcmToken;
      }

      if (pendingOpenRef.current) {
        const pending = pendingOpenRef.current;
        pendingOpenRef.current = null;
        navigateToNotification(pending);
      }

      if (!listenersRef.current.token) {
        listenersRef.current.token = observePushTokenRefreshUseCase.execute(async (newToken) => {
          await registerPushTokenUseCase.execute({
            token: newToken,
            platform,
            environment,
            appVersion
          });
          lastTokenRef.current = newToken;
        });
      }

      if (!listenersRef.current.open) {
        listenersRef.current.open = observeNotificationOpenUseCase.execute(handleOpen);
      }

      if (!listenersRef.current.message) {
        listenersRef.current.message = messaging().onMessage(async (message) => {
          try {
            await displayForegroundNotification(message as { notification?: { title?: string; body?: string }; data?: Record<string, string> });
          } catch (error) {
            console.log("[Push] Foreground notification failed", error);
          }
        });
      }

      if (!listenersRef.current.notifee) {
        listenersRef.current.notifee = notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
            const parsed = parsePushNotificationData(detail.notification?.data as Record<string, string> | undefined);
            if (parsed) handleOpen(parsed);
          }
        });
      }
    } catch (error) {
      console.log("[Push] Sync failed", error);
    } finally {
      syncingRef.current = false;
    }
  }, [
    cleanupListeners,
    displayForegroundNotification,
    getPushTokenUseCase,
    handleOpen,
    observeNotificationOpenUseCase,
    observePushTokenRefreshUseCase,
    registerPushTokenUseCase,
    requestPushPermissionUseCase,
    unregisterPushTokenUseCase,
    navigateToNotification
  ]);

  useEffect(() => {
    setPushRegistrationHandler(syncPush);
    return () => setPushRegistrationHandler(null);
  }, [syncPush]);

  useEffect(() => {
    syncPush();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncPush();
      }
    });
    return () => {
      sub.remove();
      cleanupListeners();
    };
  }, [cleanupListeners, syncPush]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initial = await getInitialNotificationUseCase.execute();
      if (!cancelled && initial) {
        handleOpen(initial);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getInitialNotificationUseCase, handleOpen]);

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
