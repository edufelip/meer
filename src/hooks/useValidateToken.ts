import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { validateToken, type ProfileDto } from "../api/auth";
import { cacheProfile } from "../storage/profileCache";

export function useValidateToken(enabled: boolean) {
  const query = useQuery<ProfileDto>({
    queryKey: ["auth", "me"],
    queryFn: validateToken,
    enabled,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (query.data) {
      void cacheProfile(query.data);
    }
  }, [query.data]);

  return query;
}
