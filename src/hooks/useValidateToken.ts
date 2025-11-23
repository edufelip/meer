import { useQuery } from "@tanstack/react-query";
import { validateToken } from "../api/auth";

export function useValidateToken(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: validateToken,
    enabled
  });
}
