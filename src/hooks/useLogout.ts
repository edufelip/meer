import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearTokens } from "../storage/authStorage";
import { navigationRef } from "../app/navigation/navigationRef";

export function useLogout() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await clearTokens();
    queryClient.clear();
    if (navigationRef.isReady()) {
      navigationRef.navigate("login");
    }
  }, [queryClient]);
}
