import { api } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SocialLoginPayload {
  provider: "google";
  idToken: string;
  client: "android" | "ios" | "web";
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", payload);
  return res.data;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/signup", payload);
  return res.data;
}

export async function validateToken(): Promise<AuthResponse["user"]> {
  const res = await api.get<AuthResponse>("/auth/me");
  return res.data.user;
}

export async function loginWithGoogle(payload: SocialLoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/google", payload);
  return res.data;
}

export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/refresh", { refreshToken });
  return res.data;
}
