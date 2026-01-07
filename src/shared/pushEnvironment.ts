import { IS_DEBUG_API_BASE_URL } from "../network/config";

export type PushEnvironment = "dev" | "staging" | "prod";
export type ApiPushEnvironment = "DEV" | "STAGING" | "PROD";
export type PushPlatform = "ios" | "android";
export type ApiPushPlatform = "IOS" | "ANDROID";

export function resolvePushEnvironment(): PushEnvironment {
  const raw = process.env.EXPO_PUBLIC_ENV;
  const normalized = raw?.toLowerCase();
  if (normalized === "dev" || normalized === "staging" || normalized === "prod") {
    return normalized;
  }
  return IS_DEBUG_API_BASE_URL ? "dev" : "prod";
}

export function toApiEnvironment(env: PushEnvironment): ApiPushEnvironment {
  switch (env) {
    case "dev":
      return "DEV";
    case "staging":
      return "STAGING";
    case "prod":
      return "PROD";
  }
}

export function toApiPlatform(platform: PushPlatform): ApiPushPlatform {
  return platform === "ios" ? "IOS" : "ANDROID";
}

export function buildTopicName(audience: "promos" | "new_stores", env: PushEnvironment): string {
  return `${audience}-${env}`;
}
