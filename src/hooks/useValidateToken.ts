import { useQuery } from "@tanstack/react-query";
import { validateToken, type ProfileDto } from "../api/auth";
import { cacheProfile } from "../storage/profileCache";

export function useValidateToken(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: validateToken,
    enabled,
    retry: false,
    staleTime: Infinity,
    cacheTime: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    onSuccess: async (profile: ProfileDto) => {
      await cacheProfile(profile);
    }
  });
}
