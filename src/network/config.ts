import urls from "../../constants/urls.json";

function normalizeApiBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

export const PROD_API_BASE_URL = normalizeApiBaseUrl(urls.prodApiBaseUrl);
export const DEV_API_BASE_URL = normalizeApiBaseUrl(urls.devApiBaseUrl || urls.prodApiBaseUrl);

const shouldUseDevApi = process.env.EXPO_PUBLIC_USE_DEV_API === "true";
const baseUrl = shouldUseDevApi ? DEV_API_BASE_URL : PROD_API_BASE_URL;

// normalize by stripping trailing slash so callers can safely append paths
export const API_BASE_URL = baseUrl;
export const IS_DEBUG_API_BASE_URL = API_BASE_URL !== PROD_API_BASE_URL;
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
