import { IS_DEBUG_MODE } from "../shared/env";

const prodBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const devBaseUrl = process.env.EXPO_PUBLIC_API_DEV_BASE_URL;
const baseUrl = IS_DEBUG_MODE ? devBaseUrl : prodBaseUrl;

if (!baseUrl) {
  throw new Error(
    IS_DEBUG_MODE
      ? "Missing EXPO_PUBLIC_API_DEV_BASE_URL environment variable"
      : "Missing EXPO_PUBLIC_API_BASE_URL environment variable"
  );
}

// normalize by stripping trailing slash so callers can safely append paths
export const API_BASE_URL = baseUrl.replace(/\/$/, "");
export const DEFAULT_TIMEOUT_MS = 10_000;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

export const IS_LOCAL_API_BASE_URL = (() => {
  try {
    const host = new URL(API_BASE_URL).hostname.toLowerCase();
    return LOCAL_HOSTS.has(host);
  } catch {
    return false;
  }
})();
