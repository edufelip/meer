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

export interface ProfileDto {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  notifyNewStores: boolean;
  notifyPromos: boolean;
  ownedThriftStore?: import("../domain/entities/ThriftStore").ThriftStore | null;
}
export interface ProfileEnvelope {
  user: ProfileDto;
}

export interface SocialLoginPayload {
  provider: "google" | "apple";
  idToken?: string;
  authorizationCode?: string;
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

export async function validateToken(): Promise<ProfileDto> {
  const res = await api.get<ProfileEnvelope | ProfileDto>("/auth/me");
  const body: any = res.data;
  const profile = (body?.user ?? body) as ProfileDto;
  return {
    ...profile,
    id: profile.id?.toString?.() ?? String(profile.id),
    notifyNewStores: profile.notifyNewStores ?? false,
    notifyPromos: profile.notifyPromos ?? false
  };
}

export async function loginWithGoogle(payload: SocialLoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/google", payload);
  return res.data;
}

export async function loginWithApple(payload: SocialLoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/apple", payload);
  return res.data;
}
