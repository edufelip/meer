import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

async function requestReset(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  const res = await api.post<ForgotPasswordResponse>("/auth/forgot-password", payload);
  return res.data;
}

export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordPayload>({
    mutationFn: requestReset
  });
}
