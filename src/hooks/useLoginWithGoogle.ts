import { useMutation } from "@tanstack/react-query";
import { loginWithGoogle, type SocialLoginPayload, type AuthResponse } from "../api/auth";

export function useLoginWithGoogle() {
  return useMutation<AuthResponse, Error, SocialLoginPayload>({
    mutationFn: loginWithGoogle
  });
}
