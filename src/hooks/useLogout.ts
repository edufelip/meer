import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearAuthSession } from "../api/client";
import { navigationRef } from "../app/navigation/navigationRef";
import { resetAllStores } from "../presentation/state/resetAllStores";

export function useLogout() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await clearAuthSession();
    resetAllStores();
    queryClient.clear();
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: "login" }] });
    }
  }, [queryClient]);
}
