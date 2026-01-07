import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthSession } from "../api/client";
import { navigationRef } from "../app/navigation/navigationRef";
import { resetAllStores } from "../presentation/state/resetAllStores";
import { triggerPushRegistration } from "../services/pushRegistration";
import { useDependencies } from "../app/providers/AppProvidersWithDI";
import { resolvePushEnvironment } from "../shared/pushEnvironment";

export function useLogout() {
  const queryClient = useQueryClient();
  const { unregisterPushTokenUseCase } = useDependencies();

  return useCallback(async () => {
    try {
      await unregisterPushTokenUseCase.execute(resolvePushEnvironment());
    } catch {
      // ignore push token unregister failures
    }
    await clearAuthSession();
    triggerPushRegistration();
    resetAllStores();
    queryClient.clear();
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: "login" }] });
    }
  }, [queryClient, unregisterPushTokenUseCase]);
}
